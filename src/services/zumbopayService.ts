export interface ZumboPayChannel {
  id: 'mpesa' | 'emola' | 'card';
  name: string;
  prefix?: string[];
  currency: string;
}

export interface ZumboPayConfig {
  configured: boolean;
  merchantId: string | null;
  environment: 'live' | 'test' | 'simulation';
  walletMpesaConfigured: boolean;
  walletEmolaConfigured: boolean;
  walletCardConfigured: boolean;
  webhookConfigured: boolean;
  channels: ZumboPayChannel[];
}

export interface ZumboPayChargePayload {
  channel: 'mpesa' | 'emola';
  phone: string;
  amount: number;
  customerName?: string;
  title?: string;
  orderId?: string;
  orderType?: 'store_product' | 'pro_subscription' | 'donation';
  metadata?: Record<string, any>;
}

export interface ZumboPayChargeResult {
  success: boolean;
  simulated?: boolean;
  channel: string;
  phone: string;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  error?: string;
}

export interface ZumboPayStatusResult {
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'expired' | 'canceled';
  simulated?: boolean;
  channel?: string;
  amount?: number;
  data?: any;
}

export interface ZumboPayPayoutPayload {
  artistId: string;
  method: 'mpesa' | 'emola';
  phone: string;
  amount: number;
  notes?: string;
}

export interface ZumboPayPayoutResult {
  success: boolean;
  simulated?: boolean;
  payoutId?: string;
  reference: string;
  amount: number;
  status: string;
  message?: string;
  error?: string;
}

// 1. Fetch ZumboPay Gateway configuration
export async function getZumboPayConfig(): Promise<ZumboPayConfig> {
  try {
    const res = await fetch('/api/zumbopay/config');
    if (!res.ok) throw new Error('Falha ao carregar configuração ZumboPay');
    return await res.json();
  } catch (err) {
    console.warn('ZumboPay config fallback:', err);
    return {
      configured: false,
      merchantId: null,
      environment: 'simulation',
      walletMpesaConfigured: false,
      walletEmolaConfigured: false,
      walletCardConfigured: false,
      webhookConfigured: false,
      channels: [
        { id: 'mpesa', name: 'M-Pesa (Vodacom)', prefix: ['84', '85'], currency: 'MZN' },
        { id: 'emola', name: 'e-Mola (Movitel)', prefix: ['86', '87'], currency: 'MZN' },
        { id: 'card', name: 'Visa / Mastercard (3DS)', currency: 'MZN' },
      ],
    };
  }
}

// 2. Request Direct STK Push (M-Pesa or e-Mola)
export async function requestZumboPayCharge(
  payload: ZumboPayChargePayload
): Promise<ZumboPayChargeResult> {
  const res = await fetch('/api/zumbopay/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao comunicar com a operadora móvel via ZumboPay.');
  }

  return data;
}

// 3. Poll / Check Transaction Status
export async function checkZumboPayStatus(reference: string): Promise<ZumboPayStatusResult> {
  const res = await fetch(`/api/zumbopay/check/${encodeURIComponent(reference)}`);
  if (!res.ok) throw new Error('Erro ao consultar estado da transação.');
  return await res.json();
}

// 4. Create Hosted Checkout for Cards
export async function createZumboPayCheckoutSession(payload: {
  title: string;
  amount: number;
  returnUrl: string;
  channels?: string[];
  customerEmail?: string;
  customerName?: string;
  orderId?: string;
  orderType?: string;
}): Promise<{ checkoutUrl?: string; reference: string; simulated?: boolean }> {
  const res = await fetch('/api/zumbopay/checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao gerar link de pagamento ZumboPay.');
  }

  return data;
}

// 5. Request Artist Payout (Saque para telemóvel M-Pesa / e-Mola)
export async function requestZumboPayPayout(
  payload: ZumboPayPayoutPayload
): Promise<ZumboPayPayoutResult> {
  const res = await fetch('/api/zumbopay/payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao solicitar levantamento via ZumboPay.');
  }

  return data;
}
