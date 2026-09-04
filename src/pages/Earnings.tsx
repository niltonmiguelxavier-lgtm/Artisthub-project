import React, { useEffect, useState } from 'react';
import { Wallet, Wallet2, ShoppingBag, Heart, PiggyBank, ArrowDownRight, Tag, ArrowUpRight, Smartphone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import StatCard from '../components/cards/StatCard';
import RevenueChart from '../components/RevenueChart';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { db, collection, getDocs, query, where, doc, setDoc } from '../lib/firebase';
import { earnings as defaultEarnings } from '../data/earnings';
import { formatCurrency, formatDate } from '../utils/format';
import { requestZumboPayPayout } from '../services/zumbopayService';
import type { EarningsHistoryItem, StoreOrder } from '../types';

const typeTone: Record<string, 'success' | 'progress' | 'cobalt' | 'neutral'> = {
  royalty: 'cobalt',
  venda: 'progress',
  doacao: 'success',
  saque: 'neutral',
};

const typeLabel: Record<string, string> = {
  royalty: 'Royalties',
  venda: 'Venda de Loja',
  doacao: 'Doação',
  saque: 'Levantamento',
};

export default function Earnings() {
  const { artistProfile, user } = useAuth();
  const [history, setHistory] = useState<EarningsHistoryItem[]>(defaultEarnings.history);
  const [salesTotal, setSalesTotal] = useState(defaultEarnings.sales);
  const [royaltiesTotal, setRoyaltiesTotal] = useState(defaultEarnings.royalties);
  const [availableBalance, setAvailableBalance] = useState(defaultEarnings.availableBalance);
  const [totalRevenue, setTotalRevenue] = useState(defaultEarnings.totalRevenue);

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  const artistId = artistProfile?.id || user?.uid;

  const handleOpenPayout = () => {
    setPayoutError(null);
    setPayoutSuccessMsg(null);
    setPayoutAmount(Math.min(availableBalance, 1000).toString());
    setIsPayoutModalOpen(true);
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccessMsg(null);

    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum < 50) {
      setPayoutError('O valor mínimo de levantamento é de 50 MT.');
      return;
    }
    if (amountNum > availableBalance) {
      setPayoutError('O valor solicitado excede o saldo disponível.');
      return;
    }

    const cleanPhone = payoutPhone.replace(/\D/g, '').slice(0, 9);
    if (cleanPhone.length !== 9) {
      setPayoutError('Introduza um número de telemóvel moçambicano válido (9 dígitos).');
      return;
    }

    try {
      setPayoutLoading(true);
      const res = await requestZumboPayPayout({
        artistId: artistId || 'artist',
        method: payoutMethod,
        phone: cleanPhone,
        amount: amountNum,
        notes: `Saque de artista: ${artistProfile?.stageName || user?.displayName || 'ArtistHub'}`,
      });

      // Update local state
      setAvailableBalance((prev) => Math.max(0, prev - amountNum));
      const newHistoryItem: EarningsHistoryItem = {
        id: res.payoutId || `saque_${Date.now()}`,
        label: `Levantamento ZumboPay (${payoutMethod.toUpperCase()} 258 ${cleanPhone})`,
        date: new Date().toISOString().split('T')[0],
        amount: -amountNum,
        type: 'saque',
      };
      setHistory((prev) => [newHistoryItem, ...prev]);

      setPayoutSuccessMsg(
        res.message || `Saque de ${amountNum} MT enviado com sucesso para ${payoutMethod.toUpperCase()} (+258 ${cleanPhone})!`
      );
    } catch (err: any) {
      setPayoutError(err.message || 'Falha ao processar levantamento via ZumboPay.');
    } finally {
      setPayoutLoading(false);
    }
  };

  useEffect(() => {
    const loadRealOrders = async () => {
      if (!artistId) return;
      try {
        const oSnap = await getDocs(query(collection(db, 'orders'), where('artistId', '==', artistId)));
        if (!oSnap.empty) {
          const orders = oSnap.docs.map((d) => d.data() as StoreOrder);
          const orderHistoryItems: EarningsHistoryItem[] = orders.map((o) => ({
            id: o.id,
            label: `Venda Loja: ${o.productTitle}`,
            date: o.createdAt.split('T')[0],
            amount: o.artistPayout, // amount net of 12% commission
            type: 'venda',
          }));

          const totalStoreNet = orders.reduce((sum, o) => sum + o.artistPayout, 0);
          setSalesTotal(defaultEarnings.sales + totalStoreNet);
          setAvailableBalance(defaultEarnings.availableBalance + totalStoreNet);
          setTotalRevenue(defaultEarnings.totalRevenue + totalStoreNet);
          setHistory([...orderHistoryItems, ...defaultEarnings.history]);
        }
      } catch (e) {
        console.warn('Orders query offline or empty:', e);
      }
    };

    loadRealOrders();
  }, [artistId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Finanças & Ganhos</h1>
          <p className="mt-1 text-sm text-bone-400">
            Receitas de vendas da loja digital (beats/tracks/merch com 12% de comissão deduzida), royalties e doações.
          </p>
        </div>

        <Button
          id="open-payout-modal-btn"
          variant="primary"
          onClick={handleOpenPayout}
          disabled={availableBalance < 50}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <ArrowUpRight size={16} />
          Levantar Saldo (ZumboPay)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Saldo disponível" value={formatCurrency(availableBalance)} icon={Wallet} />
        <StatCard label="Receitas totais" value={formatCurrency(totalRevenue)} icon={Wallet2} />
        <StatCard label="Royalties" value={formatCurrency(royaltiesTotal)} icon={PiggyBank} />
        <StatCard label="Vendas de Loja (88%)" value={formatCurrency(salesTotal)} icon={ShoppingBag} />
        <StatCard label="Doações de Fãs" value={formatCurrency(defaultEarnings.donations)} icon={Heart} />
      </div>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg text-bone-100">Receitas mensais</h2>
        <RevenueChart data={defaultEarnings.monthly} />
      </section>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <h2 className="font-display text-lg text-bone-100">Histórico de Transações</h2>
          <span className="text-xs text-bone-400">Comissão de plataforma de 12% já refletida nas vendas</span>
        </div>

        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900 p-3.5 sm:px-4 sm:py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-800 text-cobalt-400">
                  {item.type === 'doacao' ? <Heart size={14} /> : item.type === 'venda' ? <ShoppingBag size={14} /> : <PiggyBank size={14} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-bone-100">{item.label}</p>
                  <p className="text-xs text-bone-400">{formatDate(item.date)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-ink-800 sm:border-0 pt-2 sm:pt-0">
                <Badge tone={typeTone[item.type]}>{typeLabel[item.type]}</Badge>
                <span className="font-mono-data text-sm font-semibold text-teal-400 shrink-0">+{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Levantar Saldo (ZumboPay Payout) */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="Levantamento de Saldo — ZumboPay"
      >
        {payoutSuccessMsg ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="font-display text-lg font-semibold text-bone-100">
              Levantamento Concluído!
            </h3>
            <p className="text-xs text-bone-300 max-w-sm mx-auto">
              {payoutSuccessMsg}
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => setIsPayoutModalOpen(false)}
                className="w-full justify-center"
              >
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExecutePayout} className="space-y-4">
            <div className="rounded-xl border border-ink-800 bg-ink-950 p-3 flex items-center justify-between text-xs">
              <span className="text-bone-400">Saldo Disponível:</span>
              <span className="font-mono-data font-bold text-teal-400">
                {formatCurrency(availableBalance)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-bone-300 mb-2">
                Destino do Levantamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('mpesa')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                    payoutMethod === 'mpesa'
                      ? 'border-red-500/80 bg-red-500/10 text-bone-100 ring-1 ring-red-500'
                      : 'border-ink-800 bg-ink-950/40 text-bone-400 hover:border-ink-700'
                  }`}
                >
                  <img
                    src="/zumbopay/mpesa.png"
                    alt="M-Pesa"
                    className="h-5 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-semibold">M-Pesa</span>
                    <span className="text-[10px] text-bone-400">Vodacom 84/85</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('emola')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                    payoutMethod === 'emola'
                      ? 'border-amber-500/80 bg-amber-500/10 text-bone-100 ring-1 ring-amber-500'
                      : 'border-ink-800 bg-ink-950/40 text-bone-400 hover:border-ink-700'
                  }`}
                >
                  <img
                    src="/zumbopay/emola.png"
                    alt="e-Mola"
                    className="h-5 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-semibold">e-Mola</span>
                    <span className="text-[10px] text-bone-400">Movitel 86/87</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-bone-300">
                Número de Telemóvel ({payoutMethod === 'mpesa' ? '84 ou 85' : '86 ou 87'}) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs text-bone-400 border-r border-ink-800 pr-2">
                  +258
                </span>
                <input
                  type="tel"
                  required
                  maxLength={9}
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder={payoutMethod === 'mpesa' ? '84 123 4567' : '86 123 4567'}
                  className="w-full rounded-xl border border-ink-700 bg-ink-900 pl-16 pr-4 py-2.5 text-sm font-mono text-bone-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="payout-amount" className="block text-xs font-medium text-bone-300">
                Valor a Levantar (MT) *
              </label>
              <input
                id="payout-amount"
                type="number"
                min={50}
                max={availableBalance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm font-mono text-bone-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="text-[11px] text-bone-400 flex items-center gap-1.5">
              <Smartphone size={13} className="text-teal-400 shrink-0" />
              O valor será transferido instantaneamente via ZumboPay API v1.3.1.
            </div>

            {payoutError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{payoutError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-ink-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPayoutModalOpen(false)}
                disabled={payoutLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={payoutLoading || !payoutAmount || payoutPhone.length < 9}
                className="gap-2"
              >
                {payoutLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    A processar saque...
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={16} />
                    Confirmar Levantamento
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
