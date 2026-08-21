import React, { useEffect, useState } from 'react';
import { Wallet, Wallet2, ShoppingBag, Heart, PiggyBank, ArrowDownRight, Tag } from 'lucide-react';
import StatCard from '../components/cards/StatCard';
import RevenueChart from '../components/RevenueChart';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { db, collection, getDocs, query, where } from '../lib/firebase';
import { earnings as defaultEarnings } from '../data/earnings';
import { formatCurrency, formatDate } from '../utils/format';
import type { EarningsHistoryItem, StoreOrder } from '../types';

const typeTone: Record<string, 'success' | 'progress' | 'cobalt'> = {
  royalty: 'cobalt',
  venda: 'progress',
  doacao: 'success',
};

const typeLabel: Record<string, string> = {
  royalty: 'Royalties',
  venda: 'Venda de Loja',
  doacao: 'Doação',
};

export default function Earnings() {
  const { artistProfile, user } = useAuth();
  const [history, setHistory] = useState<EarningsHistoryItem[]>(defaultEarnings.history);
  const [salesTotal, setSalesTotal] = useState(defaultEarnings.sales);
  const [royaltiesTotal, setRoyaltiesTotal] = useState(defaultEarnings.royalties);
  const [availableBalance, setAvailableBalance] = useState(defaultEarnings.availableBalance);
  const [totalRevenue, setTotalRevenue] = useState(defaultEarnings.totalRevenue);

  const artistId = artistProfile?.id || user?.uid;

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
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Finanças & Ganhos</h1>
        <p className="mt-1 text-sm text-bone-400">
          Receitas de vendas da loja digital (beats/tracks/merch com 12% de comissão deduzida), royalties e doações.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Saldo disponível" value={formatCurrency(availableBalance)} icon={Wallet} />
        <StatCard label="Receitas totais" value={formatCurrency(totalRevenue)} icon={Wallet2} />
        <StatCard label="Royalties" value={formatCurrency(royaltiesTotal)} icon={PiggyBank} />
        <StatCard label="Vendas de Loja (88%)" value={formatCurrency(salesTotal)} icon={ShoppingBag} />
        <StatCard label="Doações de Fãs" value={formatCurrency(defaultEarnings.donations)} icon={Heart} />
      </div>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-display text-lg text-bone-100">Receitas mensais</h2>
        <RevenueChart data={defaultEarnings.monthly} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-bone-100">Histórico de Transações</h2>
          <span className="text-xs text-bone-400">Comissão de plataforma de 12% já refletida nas vendas</span>
        </div>

        <div className="space-y-2.5">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-cobalt-400">
                  {item.type === 'doacao' ? <Heart size={14} /> : item.type === 'venda' ? <ShoppingBag size={14} /> : <PiggyBank size={14} />}
                </span>
                <div>
                  <p className="text-sm text-bone-100">{item.label}</p>
                  <p className="text-xs text-bone-400">{formatDate(item.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={typeTone[item.type]}>{typeLabel[item.type]}</Badge>
                <span className="font-mono-data text-sm text-teal-400">+{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
