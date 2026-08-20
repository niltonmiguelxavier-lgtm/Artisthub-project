# ArtistHub

Um centro de carreira digital para artistas — organizar, promover e monetizar
a carreira musical num só lugar. Esta é a primeira versão da interface:
frontend completo, com dados mockados, pronto para receber um backend real.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router (navegação entre páginas)
- Lucide Icons

Sem backend, sem chaves de API, sem passwords no código. Todos os dados
vêm de ficheiros mockados em `src/data/`.

## Como executar o projecto

Precisas de [Node.js](https://nodejs.org) 18 ou superior instalado.

```bash
# 1. Instalar dependências
npm install

# 2. Correr em modo de desenvolvimento
npm run dev

# 3. Abrir no browser
# http://localhost:5173
```

Para criar uma versão de produção:

```bash
npm run build
npm run preview
```

## Estrutura do projecto

```
src/
├── components/
│   ├── ui/          Button, Badge, Input, Modal, EmptyState
│   ├── layout/       Sidebar, Header, MobileNavigation
│   └── cards/        StatCard, MusicCard, CampaignCard, OpportunityCard,
│                      ProgressCard, TaskCard
├── layouts/          DashboardLayout (área autenticada), PublicLayout (landing/perfil público)
├── pages/            Uma página por rota (Dashboard, Music, Promotion, Earnings, Fans,
│                      Opportunities, Career, Store, Documents, Settings, Landing, ArtistProfile)
├── data/             Dados mockados — artists.ts, music.ts, campaigns.ts, earnings.ts,
│                      opportunities.ts, fans.ts, career.ts
├── types/            Interfaces TypeScript partilhadas por toda a aplicação
├── utils/            Funções de formatação (moeda, datas, números)
└── App.tsx           Definição de todas as rotas
```

## Páginas e rotas

| Rota | Descrição |
|---|---|
| `/` | Landing page pública |
| `/artist/:handle` | Perfil público de um artista |
| `/dashboard` | Resumo da carreira do artista autenticado |
| `/career` | Diagnóstico completo da carreira |
| `/music` | Gestão de lançamentos |
| `/promotion` | Campanhas de divulgação |
| `/earnings` | Finanças, royalties e histórico de receitas |
| `/fans` | Estatísticas da base de fãs |
| `/opportunities` | Shows, festivais, concursos, colaborações |
| `/store` | Loja do artista (placeholder) |
| `/documents` | Documentos profissionais (placeholder) |
| `/settings` | Definições da conta |

## Design

Interface escura com um acento dourado/latão (`brass`) e verde-azulado
(`teal`) para indicadores de crescimento. Tipografia: Fraunces (títulos),
Inter (texto), IBM Plex Mono (números e dados). O elemento visual
assinatura é o **waveform** — um medidor em forma de onda sonora usado
para representar as percentagens de progresso da carreira, em vez de
barras de progresso genéricas. Os tokens de cor estão em
`tailwind.config.js`.

## Preparado para o Google AI Studio

Este código foi desenhado para ser facilmente transportado para o Google
AI Studio ou para qualquer backend real:

- **Sem backend próprio** — toda a lógica de dados está isolada em
  `src/data/*.ts`. Basta substituir estas funções/constantes por chamadas
  reais (Firebase, Supabase, ou outra API) sem tocar nos componentes.
- **Interfaces TypeScript centralizadas** em `src/types/index.ts` — define
  o contrato de dados que qualquer backend deverá respeitar.
- **Nenhuma chave de API ou password no código.**
- **Componentes independentes** — cada componente recebe dados via props,
  não sabe de onde vêm.

### Onde ligar cada funcionalidade futura

| Funcionalidade | Onde adicionar |
|---|---|
| Autenticação (Google, email/SMS) | Novo `AuthProvider` a envolver `<App />` em `main.tsx`; proteger `DashboardLayout` com um `PrivateRoute` |
| Base de dados (Firebase/Supabase) | Substituir os exports de `src/data/*.ts` por hooks (`useArtist()`, `useTracks()`, etc.) que consultam a base de dados |
| ArtistHub AI | `src/components/ArtistHubAI.tsx` já tem o espaço visual pronto — ligar a chamada à API de IA no `onSubmit` do input |
| Pagamentos, royalties, doações | Página `/earnings` (`src/pages/Earnings.tsx`) — ligar a um processador de pagamentos real |
| Upload de músicas e imagens | Botões "Adicionar música" (`Music.tsx`) e "Alterar fotografia" (`Settings.tsx`) — ligar a storage (Firebase Storage/Supabase Storage) |
| Notificações | Ícone de sino em `Header.tsx` — ligar a um serviço de notificações em tempo real |
| Analytics | Os `StatCard` em `Dashboard.tsx`, `Fans.tsx` e `Earnings.tsx` já consomem dados tipados — basta trocar a fonte |

Nenhuma destas funcionalidades foi implementada nesta versão, conforme
pedido — apenas a estrutura está preparada para as receber.
