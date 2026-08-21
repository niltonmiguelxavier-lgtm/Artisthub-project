import type { FanStats } from '../types';

export const fanStats: FanStats = {
  total: 12480,
  weeklyGrowthPct: 4.2,
  topCountries: [
    { country: 'Moçambique', pct: 61 },
    { country: 'África do Sul', pct: 14 },
    { country: 'Portugal', pct: 11 },
    { country: 'Brasil', pct: 8 },
    { country: 'Outros', pct: 6 },
  ],
  engagementRate: 18.4,
  mostPopularTrack: 'Prometo Te Amar',
  weeklySeries: [
    { week: 'S1', fans: 10800 },
    { week: 'S2', fans: 11150 },
    { week: 'S3', fans: 11600 },
    { week: 'S4', fans: 11950 },
    { week: 'S5', fans: 12200 },
    { week: 'S6', fans: 12480 },
  ],
};
