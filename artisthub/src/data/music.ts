import type { Track } from '../types';

export const tracks: Track[] = [
  {
    id: 'track-1',
    title: 'Prometo Te Amar',
    type: 'single',
    releaseDate: '2026-05-12',
    streams: 128400,
    status: 'lancada',
    revenue: 9840,
  },
  {
    id: 'track-2',
    title: 'Horizonte',
    type: 'single',
    releaseDate: '2026-02-03',
    streams: 96200,
    status: 'lancada',
    revenue: 7120,
  },
  {
    id: 'track-3',
    title: 'Chuva de Verão',
    type: 'colaboracao',
    releaseDate: '2025-11-20',
    streams: 60000,
    status: 'lancada',
    revenue: 4890,
  },
  {
    id: 'track-4',
    title: 'Raízes EP',
    type: 'ep',
    releaseDate: '2026-09-30',
    streams: 0,
    status: 'agendada',
    revenue: 0,
  },
  {
    id: 'track-5',
    title: 'Sem Título (demo)',
    type: 'single',
    releaseDate: '',
    streams: 0,
    status: 'rascunho',
    revenue: 0,
  },
];
