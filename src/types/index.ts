// Extended Types for ArtistHub
export type TaskStatus = 'pendente' | 'em_progresso' | 'concluido';
export type CampaignStatus = 'ativa' | 'agendada' | 'concluida' | 'pausada';
export type MusicStatus = 'lancada' | 'agendada' | 'rascunho';
export type MusicType = 'single' | 'ep' | 'album' | 'colaboracao';
export type UserRole = 'artist' | 'organizer' | 'fan';
export type SubscriptionTier = 'free' | 'pro';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Artist {
  id: string;
  userId?: string;
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
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: 'active' | 'inactive' | 'canceled';
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
  artistId: string;
  title: string;
  coverUrl?: string;
  audioUrl?: string;
  type: MusicType;
  genres?: string[];
  releaseDate: string;
  streams: number;
  status: MusicStatus;
  revenue: number; // in MT
  duration?: number; // in seconds
  audioFormat?: string; // 'mp3' | 'wav'
  isrc?: string; // optional ISRC code
  copyrightDate?: string; // optional copyright date
  createdAt?: string;
}

export interface YouTubeVideo {
  id: string;
  artistId: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  addedAt: string;
}

export type ProductCategory = 'beats' | 'exclusive_tracks' | 'merchandise';

export interface Product {
  id: string;
  artistId: string;
  artistName?: string;
  artistHandle?: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number; // in MT or USD
  coverUrl?: string;
  previewAudioUrl?: string; // 30s preview for beats/tracks
  digitalFileUrl?: string; // real or simulated protected file link
  isAvailable: boolean;
  salesCount?: number;
  createdAt?: string;
}

export interface StoreOrder {
  id: string;
  productId: string;
  productTitle: string;
  productCategory: ProductCategory;
  artistId: string;
  buyerEmail: string;
  buyerName?: string;
  amount: number;
  platformCommission: number; // 12%
  artistPayout: number; // 88%
  stripeSessionId?: string;
  status: 'completed' | 'pending';
  downloadToken: string;
  downloadExpiresAt: string; // ISO date
  createdAt: string;
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
  organizerId?: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  location: string;
  date: string;
  deadline?: string;
  description: string;
  requirements?: string;
  isFeatured?: boolean;
  status?: 'aberta' | 'encerrada';
  applicantsCount?: number;
  createdAt?: string;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  artistId: string;
  artistName: string;
  artistHandle: string;
  appliedAt: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  notes?: string;
}
