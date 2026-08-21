import type { EarningsSummary } from '../types';

export const earnings: EarningsSummary = {
  availableBalance: 6420,
  totalRevenue: 24850,
  royalties: 15230,
  sales: 6100,
  donations: 3520,
  monthly: [
    { month: 'Mar', amount: 2100 },
    { month: 'Abr', amount: 2650 },
    { month: 'Mai', amount: 3980 },
    { month: 'Jun', amount: 3200 },
    { month: 'Jul', amount: 4460 },
    { month: 'Ago', amount: 5210 },
  ],
  history: [
    { id: 'h-1', label: 'Royalties — Prometo Te Amar', date: '2026-08-14', amount: 1240, type: 'royalty' },
    { id: 'h-2', label: 'Venda — Merch "Raízes"', date: '2026-08-09', amount: 460, type: 'venda' },
    { id: 'h-3', label: 'Doação de fã — @carla.mz', date: '2026-08-05', amount: 150, type: 'doacao' },
    { id: 'h-4', label: 'Royalties — Horizonte', date: '2026-07-28', amount: 980, type: 'royalty' },
    { id: 'h-5', label: 'Venda — T-shirt edição limitada', date: '2026-07-19', amount: 620, type: 'venda' },
  ],
};
