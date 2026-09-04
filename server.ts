import express from 'express';
import path from 'path';
import crypto from 'crypto';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Capture raw body for HMAC-SHA256 signature verification in webhooks
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Lazy Stripe initialization helper
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey);
}

// ZumboPay Helper Functions
const ZUMBOPAY_API_URL = 'https://zumbopay.com/api/public/v1';

function normalizeZumboKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .replace(/\s+/g, '')
    .replace(/^bearer/i, '')
    .trim();
}

function getZumboPayHeaders(idempotencyKey?: string) {
  const apiKey = normalizeZumboKey(process.env.ZUMBOPAY_API_KEY);
  const merchantId = (process.env.ZUMBOPAY_MERCHANT_ID || '').trim();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-ZumboPay-Client': 'ArtistHub/1.3.1',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  if (merchantId) {
    headers['X-Merchant-Id'] = merchantId;
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return { headers, apiKey, merchantId };
}

// In-memory store for tracking simulated / demo ZumboPay transactions
const simulatedTransactions = new Map<
  string,
  {
    reference: string;
    channel: string;
    phone: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    createdAt: number;
    title: string;
    metadata: any;
  }
>();

// Health check endpoint
app.get('/api/health', (req, res) => {
  const { apiKey, merchantId } = getZumboPayHeaders();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    zumbopayConfigured: !!apiKey,
    zumbopayMerchantId: merchantId || null,
  });
});

// ============================================================================
// ZUMBOPAY GATEWAY ROUTES (M-Pesa, e-Mola, Visa/Mastercard para Moçambique)
// ============================================================================

// 1. ZumboPay Config & Status
app.get('/api/zumbopay/config', (req, res) => {
  const { apiKey, merchantId } = getZumboPayHeaders();
  const isLive = apiKey.startsWith('zk_live_');
  const isTest = apiKey.startsWith('zk_test_');

  res.json({
    configured: !!apiKey,
    merchantId: merchantId || null,
    environment: isLive ? 'live' : isTest ? 'test' : 'simulation',
    walletMpesaConfigured: !!process.env.ZUMBOPAY_WALLET_MPESA,
    walletEmolaConfigured: !!(process.env.ZUMBOPAY_WALLET_EMOLA || process.env.ZUMBOPAY_WALLET_MPESA),
    walletCardConfigured: !!(process.env.ZUMBOPAY_WALLET_CARD || process.env.ZUMBOPAY_WALLET_MPESA),
    webhookConfigured: !!process.env.ZUMBOPAY_WEBHOOK_SECRET,
    channels: [
      { id: 'mpesa', name: 'M-Pesa (Vodacom)', prefix: ['84', '85'], currency: 'MZN' },
      { id: 'emola', name: 'e-Mola (Movitel)', prefix: ['86', '87'], currency: 'MZN' },
      { id: 'card', name: 'Visa / Mastercard (3DS)', currency: 'MZN' },
    ],
  });
});

// 2. Direct STK Push (Cobrança directa no telemóvel via M-Pesa ou e-Mola)
app.post('/api/zumbopay/charge', async (req, res) => {
  try {
    const { channel, phone, amount, customerName, title, orderId, orderType, metadata } = req.body;

    if (!channel || !['mpesa', 'emola'].includes(channel)) {
      return res.status(400).json({ error: 'Canal inválido. Escolha mpesa ou emola.' });
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
    }

    const cleanPhone = phone.replace(/\D/g, '').replace(/^258/, '').slice(0, 9);
    if (!/^\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        error: 'Número de telemóvel moçambicano inválido. Deve ter 9 dígitos (ex: 841234567).',
      });
    }

    // Validate prefix
    if (channel === 'mpesa' && !cleanPhone.startsWith('84') && !cleanPhone.startsWith('85')) {
      return res.status(400).json({
        error: 'Para M-Pesa o número deve começar com 84 ou 85 (Vodacom).',
      });
    }
    if (channel === 'emola' && !cleanPhone.startsWith('86') && !cleanPhone.startsWith('87')) {
      return res.status(400).json({
        error: 'Para e-Mola o número deve começar com 86 ou 87 (Movitel).',
      });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valor da transação inválido.' });
    }

    const { headers, apiKey } = getZumboPayHeaders(
      `charge_${orderId || Date.now()}_${cleanPhone}`
    );

    const walletId =
      channel === 'mpesa'
        ? process.env.ZUMBOPAY_WALLET_MPESA
        : (process.env.ZUMBOPAY_WALLET_EMOLA || process.env.ZUMBOPAY_WALLET_MPESA);

    // If live or test API key is configured with wallet, call ZumboPay API
    if (apiKey && walletId) {
      const response = await fetch(`${ZUMBOPAY_API_URL}/charges`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          wallet_id: walletId,
          amount: numAmount,
          msisdn: `258${cleanPhone}`,
          customer_name: customerName || 'Cliente ArtistHub',
          source_id: `artisthub-${orderId || Date.now()}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || 'Falha ao solicitar pagamento ZumboPay.',
          detail: data,
        });
      }

      return res.json({
        success: true,
        channel,
        phone: cleanPhone,
        reference: data?.data?.reference || data?.reference,
        status: data?.data?.status || 'pending',
        message:
          channel === 'emola'
            ? '🔒 Introduza o PIN e-Mola no seu telemóvel para autorizar a transação.'
            : '📲 Confirme o pagamento M-Pesa no seu telemóvel através do PIN.',
      });
    }

    // Interactive Demo / Sandbox Fallback (when keys are not set yet)
    const simulatedRef = `ZP_${channel.toUpperCase()}_${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;

    simulatedTransactions.set(simulatedRef, {
      reference: simulatedRef,
      channel,
      phone: cleanPhone,
      amount: numAmount,
      status: 'pending',
      createdAt: Date.now(),
      title: title || 'Compra ArtistHub',
      metadata: metadata || {},
    });

    res.json({
      success: true,
      simulated: true,
      channel,
      phone: cleanPhone,
      reference: simulatedRef,
      status: 'pending',
      message:
        channel === 'emola'
          ? '🔒 [Modo Simulação] Verifique o seu telemóvel e introduza o PIN e-Mola.'
          : '📲 [Modo Simulação] Notificação M-Pesa enviada ao telemóvel 258 ' + cleanPhone,
    });
  } catch (error: any) {
    console.error('ZumboPay Charge Error:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar STK push.' });
  }
});

// 3. Check Charge / Transaction Status (authoritative polling)
app.get('/api/zumbopay/check/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const { headers, apiKey } = getZumboPayHeaders();

    if (apiKey) {
      const response = await fetch(`${ZUMBOPAY_API_URL}/payments/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const pStatus = data?.data?.status || data?.status || 'pending';
        return res.json({
          reference,
          status: pStatus,
          data: data.data || data,
        });
      }
    }

    // Check simulated transaction
    const sim = simulatedTransactions.get(reference);
    if (sim) {
      // Automatically succeed after 4 seconds to simulate user typing PIN on phone
      const elapsed = Date.now() - sim.createdAt;
      if (elapsed > 4000 && sim.status === 'pending') {
        sim.status = 'success';
        simulatedTransactions.set(reference, sim);
      }
      return res.json({
        reference,
        status: sim.status,
        simulated: true,
        channel: sim.channel,
        amount: sim.amount,
      });
    }

    res.json({ reference, status: 'pending' });
  } catch (error: any) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: error.message || 'Erro ao verificar estado da transação.' });
  }
});

// 4. Hosted Checkout / Payment Link (Visa/Mastercard or Multi-channel)
app.post('/api/zumbopay/checkout-session', async (req, res) => {
  try {
    const { title, amount, returnUrl, channels, customerEmail, customerName, orderId, orderType } = req.body;
    const { headers, apiKey } = getZumboPayHeaders();
    const walletId = process.env.ZUMBOPAY_WALLET_CARD || process.env.ZUMBOPAY_WALLET_MPESA;

    if (apiKey && walletId) {
      const response = await fetch(`${ZUMBOPAY_API_URL}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title || 'ArtistHub Compra',
          amount: Number(amount),
          currency: 'MZN',
          channels: channels || ['card', 'mpesa', 'emola'],
          wallet_id: walletId,
          source_id: orderId || `order_${Date.now()}`,
          return_url: returnUrl || 'http://localhost:3000/store/success',
          callback_url: returnUrl || 'http://localhost:3000/store/success',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || 'Falha ao criar link ZumboPay.',
          detail: data,
        });
      }

      return res.json({
        checkoutUrl: data?.data?.checkout_url || data?.checkout_url,
        reference: data?.data?.reference || data?.reference,
      });
    }

    // Simulated Checkout Link
    const simRef = `ZP_CHK_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    res.json({
      simulated: true,
      checkoutUrl: returnUrl ? `${returnUrl}?zumbopay_ref=${simRef}&simulated=true` : undefined,
      reference: simRef,
    });
  } catch (error: any) {
    console.error('ZumboPay checkout session error:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar checkout ZumboPay.' });
  }
});

// 5. Artist Payouts (Levantamento de Saldo para M-Pesa ou e-Mola)
app.post('/api/zumbopay/payout', async (req, res) => {
  try {
    const { artistId, method, phone, amount, notes } = req.body;

    if (!method || !['mpesa', 'emola'].includes(method)) {
      return res.status(400).json({ error: 'Método de levantamento deve ser mpesa ou emola.' });
    }

    const cleanPhone = (phone || '').replace(/\D/g, '').replace(/^258/, '').slice(0, 9);
    if (!/^\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Telefone de destino inválido (9 dígitos).' });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 50) {
      return res.status(400).json({ error: 'O valor mínimo de levantamento é 50 MT.' });
    }

    const { headers, apiKey } = getZumboPayHeaders();
    const walletId =
      method === 'mpesa'
        ? process.env.ZUMBOPAY_WALLET_MPESA
        : (process.env.ZUMBOPAY_WALLET_EMOLA || process.env.ZUMBOPAY_WALLET_MPESA);

    if (apiKey && walletId) {
      const response = await fetch(`${ZUMBOPAY_API_URL}/payouts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          wallet_id: walletId,
          amount: numAmount,
          method,
          destination: cleanPhone,
          notes: notes || `Levantamento de Artista: ${artistId}`,
          auto_dispatch: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || 'Falha ao solicitar saque.',
          detail: data,
        });
      }

      return res.json({
        success: true,
        payoutId: data?.data?.id || data?.id,
        reference: data?.data?.reference || data?.reference,
        amount: numAmount,
        status: data?.data?.status || 'pending',
      });
    }

    // Simulated Payout
    res.json({
      success: true,
      simulated: true,
      payoutId: `PO_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      reference: `ZP_PO_${Date.now()}`,
      amount: numAmount,
      status: 'success',
      message: `Saque de ${numAmount} MT enviado para 258 ${cleanPhone} (${method.toUpperCase()}).`,
    });
  } catch (error: any) {
    console.error('ZumboPay Payout error:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar levantamento.' });
  }
});

// 6. Webhook Receiver (HMAC-SHA256 matching ZumboPay specification)
app.post('/api/zumbopay/webhook', (req: any, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const secret = (process.env.ZUMBOPAY_WEBHOOK_SECRET || '').trim();

    const signature = (req.headers['x-signature'] || req.headers['x_signature'] || '') as string;
    const timestamp = (req.headers['x-timestamp'] || req.headers['x_timestamp'] || '') as string;

    if (secret && signature && timestamp) {
      const cleanSig = signature.replace(/^sha256=/i, '').trim();
      const tsNum = parseInt(timestamp, 10);
      const maxSkewMs = 300000; // 5 mins

      if (!tsNum || Math.abs(Date.now() - tsNum) > maxSkewMs) {
        return res.status(401).json({ error: 'stale_timestamp' });
      }

      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(cleanSig, 'hex'), Buffer.from(expected, 'hex'))) {
        return res.status(401).json({ error: 'invalid_signature' });
      }
    }

    const payload = req.body;
    console.log('ZumboPay Webhook received event:', payload?.event || payload?.type);

    res.json({ ok: true, received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'webhook_failed' });
  }
});

// 7. Test Connection & Validate Wallets
app.get('/api/zumbopay/validate', async (req, res) => {
  try {
    const { headers, apiKey, merchantId } = getZumboPayHeaders();
    if (!apiKey) {
      return res.json({
        ready: false,
        message: 'Chave ZUMBOPAY_API_KEY não configurada.',
      });
    }

    const response = await fetch(`${ZUMBOPAY_API_URL}/merchant/validate`, {
      headers,
    });

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao validar com ZumboPay.' });
  }
});


// Checkout session for Store Products (Beats, Exclusives, Merch)
app.post('/api/create-product-checkout', async (req, res) => {
  try {
    const { productId, title, price, category, artistId, buyerEmail, successUrl, cancelUrl } = req.body;

    if (!price || !title) {
      return res.status(400).json({ error: 'Título e preço são obrigatórios.' });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Return simulated success token when testing without live Stripe keys
      const mockToken = 'mock_order_' + Math.random().toString(36).substring(2, 10);
      return res.json({
        simulated: true,
        downloadToken: mockToken,
        message: 'Modo de teste: Simulação de checkout concluída.',
        url: successUrl ? `${successUrl}?orderId=${mockToken}&simulated=true` : undefined,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: `Categoria: ${category || 'Música/Merch'} - Artista ID: ${artistId || 'ArtistHub'}`,
            },
            unit_amount: Math.round(Number(price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: buyerEmail || undefined,
      metadata: {
        productId,
        artistId,
        category,
        orderType: 'store_product',
      },
      success_url: `${successUrl || 'http://localhost:3000/store/success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || 'http://localhost:3000/store',
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe product checkout error:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar pagamento com Stripe.' });
  }
});

// Checkout session for Artist PRO Subscriptions
app.post('/api/create-subscription-checkout', async (req, res) => {
  try {
    const { artistId, planType, successUrl, cancelUrl } = req.body;

    const stripe = getStripe();
    if (!stripe) {
      return res.json({
        simulated: true,
        message: 'Modo de teste: Subscrição PRO activada no perfil.',
        url: successUrl ? `${successUrl}?subscribed=pro&simulated=true` : undefined,
      });
    }

    const priceAmount = planType === 'annual' ? 9900 : 990; // $99/year or $9.90/month
    const interval = planType === 'annual' ? 'year' : 'month';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `ArtistHub PRO (${planType === 'annual' ? 'Anual' : 'Mensal'})`,
              description: 'Músicas ilimitadas, estatísticas avançadas, selo de verificação e destaque em oportunidades.',
            },
            unit_amount: priceAmount,
            recurring: { interval: interval as any },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        artistId,
        planType,
        orderType: 'pro_subscription',
      },
      success_url: `${successUrl || 'http://localhost:3000/settings'}?pro_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || 'http://localhost:3000/settings',
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: error.message || 'Erro ao iniciar subscrição PRO.' });
  }
});

// Start Express + Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ArtistHub Server running on http://localhost:${PORT}`);
  });
}

startServer();
