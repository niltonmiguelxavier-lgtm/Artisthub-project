import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Globe,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  requestZumboPayCharge,
  checkZumboPayStatus,
  createZumboPayCheckoutSession,
  getZumboPayConfig,
  type ZumboPayConfig,
  type ZumboPayChargeResult,
} from '../../services/zumbopayService';

export interface ZumboPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  amount: number; // in MZN Meticais (or converted)
  amountUsd?: number;
  currency?: string;
  orderType: 'store_product' | 'pro_subscription' | 'donation';
  orderId?: string;
  metadata?: Record<string, any>;
  onSuccess: (paymentInfo: {
    reference: string;
    channel: string;
    amount: number;
    phone?: string;
  }) => void;
  onStripeFallback?: () => void;
}

type PaymentMethod = 'mpesa' | 'emola' | 'card' | 'stripe';
type PaymentStep = 'select' | 'waiting_pin' | 'success' | 'failed';

export default function ZumboPayModal({
  isOpen,
  onClose,
  title,
  amount,
  amountUsd,
  currency = 'MZN',
  orderType,
  orderId,
  metadata,
  onSuccess,
  onStripeFallback,
}: ZumboPayModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<PaymentStep>('select');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chargeResult, setChargeResult] = useState<ZumboPayChargeResult | null>(null);
  const [pollCountdown, setPollCountdown] = useState(60);
  const [config, setConfig] = useState<ZumboPayConfig | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load gateway config on open
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setErrorMessage(null);
      setChargeResult(null);
      setPollCountdown(60);
      getZumboPayConfig().then(setConfig).catch(console.warn);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }
  }, [isOpen]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Auto-detect mobile provider from phone input
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 9);
    setPhone(raw);
    if (raw.startsWith('84') || raw.startsWith('85')) {
      if (method !== 'mpesa') setMethod('mpesa');
    } else if (raw.startsWith('86') || raw.startsWith('87')) {
      if (method !== 'emola') setMethod('emola');
    }
  };

  // Start polling ZumboPay status
  const startPolling = (ref: string, currentChannel: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    let attempts = 0;
    const maxAttempts = 20; // 60 seconds (every 3s)

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      setPollCountdown((prev) => Math.max(0, prev - 3));

      try {
        const res = await checkZumboPayStatus(ref);
        if (res.status === 'success') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStep('success');
          onSuccess({
            reference: ref,
            channel: currentChannel,
            amount,
            phone,
          });
        } else if (res.status === 'failed' || res.status === 'canceled') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStep('failed');
          setErrorMessage('O pagamento foi recusado ou cancelado no telemóvel.');
        } else if (attempts >= maxAttempts) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStep('failed');
          setErrorMessage('Tempo limite excedido à espera do PIN. Pode tentar novamente.');
        }
      } catch (err) {
        console.warn('Status poll error:', err);
      }
    }, 3000);
  };

  // Handle STK Push or Hosted Card Payment
  const handleInitiatePayment = async () => {
    setErrorMessage(null);

    if (method === 'stripe' && onStripeFallback) {
      onStripeFallback();
      return;
    }

    if (method === 'card') {
      try {
        setLoading(true);
        const res = await createZumboPayCheckoutSession({
          title,
          amount,
          returnUrl: `${window.location.origin}/store/success`,
          orderId,
          orderType,
        });

        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        } else {
          // Simulation fallback for card
          setStep('success');
          onSuccess({
            reference: res.reference,
            channel: 'card',
            amount,
          });
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao iniciar pagamento com cartão ZumboPay.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mobile Money (M-Pesa or e-Mola STK Push)
    if (!phone || phone.length !== 9) {
      setErrorMessage('Por favor introduza um número de telemóvel válido de 9 dígitos (ex: 841234567).');
      return;
    }

    try {
      setLoading(true);
      const res = await requestZumboPayCharge({
        channel: method,
        phone,
        amount,
        title,
        orderId,
        orderType,
        metadata,
      });

      setChargeResult(res);
      setStep('waiting_pin');
      setPollCountdown(60);
      startPolling(res.reference, method);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao comunicar com o gateway ZumboPay.');
    } finally {
      setLoading(false);
    }
  };

  // Manual verify button in waiting state
  const handleManualVerify = async () => {
    if (!chargeResult?.reference) return;
    setLoading(true);
    try {
      const res = await checkZumboPayStatus(chargeResult.reference);
      if (res.status === 'success') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setStep('success');
        onSuccess({
          reference: chargeResult.reference,
          channel: method,
          amount,
          phone,
        });
      } else {
        alert('Ainda aguardando confirmação no telemóvel. Certifique-se de que digitou o PIN.');
      }
    } catch (e: any) {
      alert('Não foi possível verificar no momento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="zumbopay-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'waiting_pin') onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-2xl"
      >
        {/* Top ZumboPay Brand Banner */}
        <div className="flex items-center justify-between border-b border-ink-800 bg-ink-950/60 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/zumbopay/zumbopay.png"
              alt="ZumboPay Logo"
              className="h-6 w-auto object-contain"
              onError={(e) => {
                // Fallback text if image not found
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="leading-tight">
              <span className="font-display text-sm font-semibold tracking-wide text-bone-100">
                ZumboPay Payments
              </span>
              <span className="block text-[11px] text-bone-400">
                Moçambique & Pagamentos Seguros
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-medium text-teal-400 border border-teal-500/20">
              <ShieldCheck size={12} />
              SSL 256-bit
            </span>
            <button
              id="close-zumbopay-modal"
              onClick={onClose}
              className="rounded-lg p-1 text-bone-400 hover:bg-ink-800 hover:text-bone-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Order Summary Strip */}
          <div className="mb-6 rounded-xl border border-ink-800 bg-ink-950/40 p-3.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-bone-400 uppercase tracking-wider font-semibold">Resumo do Pedido</p>
              <h3 className="truncate text-sm font-medium text-bone-100 mt-0.5">{title}</h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-bone-400">Total a Pagar</span>
              <p className="font-mono-data text-lg font-bold text-teal-400">
                {amount.toLocaleString('pt-MZ')} <span className="text-xs font-normal text-teal-300">MT</span>
              </p>
            </div>
          </div>

          {/* STEP 1: Method & Phone Selection */}
          {step === 'select' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-bone-300 mb-2">
                  Selecione o Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* M-Pesa */}
                  <button
                    id="select-method-mpesa"
                    type="button"
                    onClick={() => setMethod('mpesa')}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      method === 'mpesa'
                        ? 'border-red-500/80 bg-red-500/10 text-bone-100 ring-1 ring-red-500'
                        : 'border-ink-800 bg-ink-950/30 text-bone-400 hover:border-ink-700 hover:text-bone-200'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1.5">
                      <img
                        src="/zumbopay/mpesa.png"
                        alt="M-Pesa"
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">M-Pesa</span>
                    <span className="text-[10px] text-bone-400">84 / 85</span>
                  </button>

                  {/* e-Mola */}
                  <button
                    id="select-method-emola"
                    type="button"
                    onClick={() => setMethod('emola')}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      method === 'emola'
                        ? 'border-amber-500/80 bg-amber-500/10 text-bone-100 ring-1 ring-amber-500'
                        : 'border-ink-800 bg-ink-950/30 text-bone-400 hover:border-ink-700 hover:text-bone-200'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1.5">
                      <img
                        src="/zumbopay/emola.png"
                        alt="e-Mola"
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">e-Mola</span>
                    <span className="text-[10px] text-bone-400">86 / 87</span>
                  </button>

                  {/* Visa / Mastercard */}
                  <button
                    id="select-method-card"
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      method === 'card'
                        ? 'border-cobalt-500/80 bg-cobalt-500/10 text-bone-100 ring-1 ring-cobalt-500'
                        : 'border-ink-800 bg-ink-950/30 text-bone-400 hover:border-ink-700 hover:text-bone-200'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center mb-1.5">
                      <img
                        src="/zumbopay/visa-mastercard.png"
                        alt="Cartão Bancário"
                        className="h-5 w-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">Cartão MPGS</span>
                    <span className="text-[10px] text-bone-400">Visa / Master</span>
                  </button>
                </div>
              </div>

              {/* Mobile Phone Input for M-Pesa / e-Mola */}
              {(method === 'mpesa' || method === 'emola') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-bone-300">
                      Número do Telemóvel ({method === 'mpesa' ? 'Vodacom' : 'Movitel'})
                    </label>
                    <span className="text-[11px] text-bone-400">
                      {method === 'mpesa' ? 'Começa por 84 ou 85' : 'Começa por 86 ou 87'}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-bone-400 border-r border-ink-800 pr-2">
                      <span className="text-sm">🇲🇿</span>
                      <span className="text-xs font-mono font-medium text-bone-300">+258</span>
                    </div>

                    <input
                      id="zumbopay-phone-input"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={method === 'mpesa' ? '84 123 4567' : '86 123 4567'}
                      maxLength={9}
                      className="w-full rounded-xl border border-ink-800 bg-ink-950 pl-24 pr-4 py-3 text-sm font-mono tracking-wider text-bone-100 placeholder-ink-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <p className="text-[11px] text-bone-400 flex items-center gap-1.5 pt-0.5">
                    <Smartphone size={13} className="text-teal-400 shrink-0" />
                    Receberá um pedido no seu ecrã para introduzir o seu PIN secreto.
                  </p>
                </div>
              )}

              {/* Card info notice */}
              {method === 'card' && (
                <div className="rounded-xl border border-ink-800 bg-ink-950/40 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-bone-200">
                    <CreditCard size={16} className="text-cobalt-400" />
                    Pagamento com Cartão de Débito ou Crédito
                  </div>
                  <p className="text-xs text-bone-400 leading-relaxed">
                    Será redirecionado de forma segura para o portal 3D-Secure ZumboPay (MPGS) para autorizar a operação com o seu banco moçambicano ou internacional.
                  </p>
                </div>
              )}

              {/* Stripe option link for international users */}
              {onStripeFallback && (
                <div className="pt-2 border-t border-ink-800/80 flex items-center justify-between text-xs text-bone-400">
                  <span className="flex items-center gap-1">
                    <Globe size={13} />
                    Cartão internacional em USD?
                  </span>
                  <button
                    id="switch-to-stripe-btn"
                    type="button"
                    onClick={() => {
                      setMethod('stripe');
                      handleInitiatePayment();
                    }}
                    className="text-cobalt-400 hover:text-cobalt-300 font-medium underline-offset-2 hover:underline"
                  >
                    Usar Stripe Checkout ({amountUsd ? `$${amountUsd}` : 'USD'})
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                id="submit-zumbopay-charge"
                variant="primary"
                onClick={handleInitiatePayment}
                disabled={loading || ((method === 'mpesa' || method === 'emola') && phone.length < 9)}
                className="w-full justify-center py-3 text-sm font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    A contactar a operadora...
                  </>
                ) : (
                  <>
                    Pagar {amount.toLocaleString('pt-MZ')} MT com{' '}
                    {method === 'mpesa' ? 'M-Pesa' : method === 'emola' ? 'e-Mola' : 'Cartão'}
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* STEP 2: Waiting for PIN on Mobile Phone */}
          {step === 'waiting_pin' && (
            <div className="text-center py-4 space-y-5">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500/20 opacity-75"></span>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-ink-950 border border-teal-500/40 text-teal-400 shadow-lg">
                  <Smartphone size={28} className="animate-pulse" />
                </div>
              </div>

              <div>
                <h4 className="font-display text-lg font-semibold text-bone-100">
                  Confirme no seu telemóvel
                </h4>
                <p className="mt-1 text-xs text-bone-300 max-w-sm mx-auto leading-relaxed">
                  Enviámos uma notificação de pagamento para o número{' '}
                  <span className="font-mono font-semibold text-teal-300">+258 {phone}</span>.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-3 py-1 border border-ink-800 text-xs text-bone-400">
                  <Clock size={12} className="text-amber-400" />
                  <span>Aguardando PIN... ({pollCountdown}s restantes)</span>
                </div>
              </div>

              <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-3.5 text-left text-xs text-bone-300 space-y-1.5">
                <p className="font-semibold text-bone-200">Instruções:</p>
                <ol className="list-decimal list-inside space-y-1 text-bone-400">
                  <li>Desbloqueie o seu telemóvel agora.</li>
                  <li>Aparecerá um menu a solicitar autorização de <strong>{amount} MT</strong>.</li>
                  <li>Digite o seu código secreto (PIN {method === 'mpesa' ? 'M-Pesa' : 'e-Mola'}).</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  id="manual-verify-pin-btn"
                  variant="primary"
                  onClick={handleManualVerify}
                  disabled={loading}
                  className="flex-1 justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  Já inseri o PIN / Confirmar
                </Button>

                <Button
                  id="cancel-waiting-pin-btn"
                  variant="ghost"
                  onClick={() => {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    setStep('select');
                  }}
                  className="px-3"
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Success */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h4 className="font-display text-xl font-bold text-bone-100">
                  Pagamento Confirmado!
                </h4>
                <p className="mt-1 text-xs text-bone-400">
                  O valor de <strong className="text-teal-300">{amount} MT</strong> foi creditado com sucesso via ZumboPay.
                </p>
              </div>

              <div className="rounded-xl border border-ink-800 bg-ink-950 p-3 text-xs text-bone-400 space-y-1">
                <div className="flex justify-between">
                  <span>Referência ZumboPay:</span>
                  <span className="font-mono text-bone-200 font-semibold">{chargeResult?.reference || 'ZP_CONFIRMED'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span className="uppercase text-bone-200">{method}</span>
                </div>
              </div>

              <Button
                id="finish-zumbopay-success-btn"
                variant="primary"
                onClick={onClose}
                className="w-full justify-center"
              >
                Concluir & Aceder
              </Button>
            </div>
          )}

          {/* STEP 4: Payment Failed */}
          {step === 'failed' && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertCircle size={32} />
              </div>

              <div>
                <h4 className="font-display text-lg font-bold text-bone-100">
                  Falha no Pagamento
                </h4>
                <p className="mt-1 text-xs text-red-400 max-w-sm mx-auto">
                  {errorMessage || 'A transação não pôde ser concluída no telemóvel.'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  id="retry-zumbopay-btn"
                  variant="primary"
                  onClick={() => {
                    setStep('select');
                    setErrorMessage(null);
                  }}
                  className="flex-1 justify-center"
                >
                  Tentar Novamente
                </Button>
                <Button
                  id="close-failed-zumbopay-btn"
                  variant="ghost"
                  onClick={onClose}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="border-t border-ink-800/60 bg-ink-950/40 px-5 py-2.5 flex items-center justify-between text-[11px] text-bone-400">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-teal-400" />
            Integrado com ZumboPay API v1.3.1
          </span>
          <span className="font-mono">Vodacom / Movitel / MPGS</span>
        </div>
      </motion.div>
    </div>
  );
}
