import type { CareerIndicator, Task } from '../types';

export const careerIndicators: CareerIndicator[] = [
  {
    id: 'ci-1',
    label: 'Música',
    value: 82,
    description: 'Catálogo de lançamentos e qualidade de produção.',
  },
  {
    id: 'ci-2',
    label: 'Presença digital',
    value: 67,
    description: 'Perfis, redes sociais e presença nas plataformas de streaming.',
  },
  {
    id: 'ci-3',
    label: 'Promoção',
    value: 54,
    description: 'Campanhas activas e alcance dos teus lançamentos.',
  },
  {
    id: 'ci-4',
    label: 'Monetização',
    value: 41,
    description: 'Diversificação de receitas: royalties, vendas e apoio de fãs.',
  },
  {
    id: 'ci-5',
    label: 'Organização profissional',
    value: 73,
    description: 'Documentos, contratos e informação da tua carreira.',
  },
];

export const nextActions: Task[] = [
  {
    id: 'task-1',
    title: 'Completar o teu perfil',
    description: 'Adiciona biografia, fotografias e redes sociais ao teu perfil público.',
    status: 'em_progresso',
  },
  {
    id: 'task-2',
    title: 'Adicionar a tua próxima música',
    description: 'Carrega a capa, data de lançamento e metadados da faixa.',
    status: 'pendente',
  },
  {
    id: 'task-3',
    title: 'Criar campanha de divulgação',
    description: 'Define objectivo, orçamento e público-alvo para o próximo lançamento.',
    status: 'pendente',
  },
  {
    id: 'task-4',
    title: 'Adicionar links das redes sociais',
    description: 'Liga o Instagram, TikTok, YouTube e Spotify ao teu perfil.',
    status: 'concluido',
  },
  {
    id: 'task-5',
    title: 'Configurar monetização',
    description: 'Activa royalties, loja e apoio de fãs para começares a receber.',
    status: 'pendente',
  },
];
