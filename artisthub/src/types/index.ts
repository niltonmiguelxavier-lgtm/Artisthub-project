// Core domain types for ArtistHub.
// These interfaces define the shape of data that will eventually come
// from a real backend (Firebase/Supabase/API). Keeping them centralized
// here means the UI layer never needs to change when the data source does.

export type TaskStatus = 'pendente' | 'em_progresso' | 'concluido';
export type CampaignStatus = 'ativa' | 'agendada' | 'concluida' | 'pausada';
export type MusicStatus = 'lancada' | 'agendada' | 'rascunho';
export type MusicType = 'single' | 'ep' | 'album' | 'colaboracao';

export interface Artist {
  id: string;
  stageName: string;
  fullName: string;
  handle: string; // used to build /artist/:handle
  avatarUrl?: string;
  coverUrl?: string;
  bio: string;
  location: string;
  genres: string[];
  followers: number;
  verified: boolean;
  socials: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    spotify?: string;
  };
}

export interface CareerIndicator {
  id: string;
  label: string;
  value: number; // 0-100
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}

export interface Track {
  id: string;
  title: string;
  coverUrl?: string;
  type: MusicType;
  releaseDate: string;
  streams: number;
  status: MusicStatus;
  revenue: number; // in MT
}

export interface Campaign {
  id: string;
  trackTitle: string;
  date: string;
  reach: number;
  clicks: number;
  views: number;
  engagementRate: number; // percentage
  status: CampaignStatus;
}

export interface RevenuePoint {
  month: string;
  amount: number;
}

export interface EarningsSummary {
  availableBalance: number;
  totalRevenue: number;
  royalties: number;
  sales: number;
  donations: number;
  monthly: RevenuePoint[];
  history: EarningsHistoryItem[];
}

export interface EarningsHistoryItem {
  id: string;
  label: string;
  date: string;
  amount: number;
  type: 'royalty' | 'venda' | 'doacao';
}

export interface FanStats {
  total: number;
  weeklyGrowthPct: number;
  topCountries: { country: string; pct: number }[];
  engagementRate: number;
  mostPopularTrack: string;
  weeklySeries: { week: string; fans: number }[];
}

export type OpportunityCategory =
  | 'show'
  | 'festival'
  | 'concurso'
  | 'colaboracao'
  | 'marca'
  | 'produtor';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  location: string;
  date: string;
  description: string;
}
