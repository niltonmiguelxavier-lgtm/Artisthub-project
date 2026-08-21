import express from 'express';
import path from 'path';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Stripe initialization helper
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  });
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
