import type { Campaign } from '../types';

export const campaigns: Campaign[] = [
  {
    id: 'camp-1',
    trackTitle: 'Prometo Te Amar',
    date: '2026-05-10',
    reach: 84200,
    clicks: 6120,
    views: 41500,
    engagementRate: 7.3,
    status: 'ativa',
  },
  {
    id: 'camp-2',
    trackTitle: 'Horizonte',
    date: '2026-02-01',
    reach: 52300,
    clicks: 3040,
    views: 22800,
    engagementRate: 5.8,
    status: 'concluida',
  },
  {
    id: 'camp-3',
    trackTitle: 'Raízes EP',
    date: '2026-09-25',
    reach: 0,
    clicks: 0,
    views: 0,
    engagementRate: 0,
    status: 'agendada',
  },
  {
    id: 'camp-4',
    trackTitle: 'Chuva de Verão',
    date: '2025-11-18',
    reach: 31700,
    clicks: 1890,
    views: 15400,
    engagementRate: 6.0,
    status: 'pausada',
  },
];
