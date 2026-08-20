import React from 'react';
import { Wallet, Wallet2, ShoppingBag, Heart } from 'lucide-react';
import StatCard from '../components/cards/StatCard';
import RevenueChart from '../components/RevenueChart';
import Badge from '../components/ui/Badge';
import { earnings } from '../data/earnings';
import { formatCurrency, formatDate } from '../utils/format';

const typeTone: Record<string, 'success' | 'progress' | 'brass'> = {
  royalty: 'brass',
  venda: 'progress',
  doacao: 'success',
};

const typeLabel: Record<string, string> = {
  royalty: 'Royalties',
  venda: 'Venda',
  doacao: 'Doação',
};

export default function Earnings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Finanças</h1>
        <p className="mt-1 text-sm text-bone-400">Os teus ganhos, num só lugar. Pagamentos reais chegam em breve.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saldo disponível" value={formatCurrency(earnings.availableBalance)} icon={Wallet} />
        <StatCard label="Receitas totais" value={formatCurrency(earnings.totalRevenue)} icon={Wallet2} />
        <StatCard label="Royalties" value={formatCurrency(earnings.royalties)} icon={Wallet2} />
        <StatCard label="Vendas" value={formatCurrency(earnings.sales)} icon={ShoppingBag} />
      </div>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-display text-lg text-bone-100">Receitas mensais</h2>
        <RevenueChart data={earnings.monthly} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg text-bone-100">Histórico</h2>
        <div className="space-y-2.5">
          {earnings.history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-brass-400">
                  {item.type === 'doacao' ? <Heart size={14} /> : <ShoppingBag size={14} />}
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
