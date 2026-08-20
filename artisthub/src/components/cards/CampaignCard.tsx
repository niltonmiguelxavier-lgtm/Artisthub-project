import React from 'react';
import { Eye, MousePointerClick, Radar, TrendingUp } from 'lucide-react';
import type { Campaign } from '../../types';
import Badge from '../ui/Badge';
import { formatCompact, formatDate } from '../../utils/format';

const statusMeta: Record<Campaign['status'], { label: string; tone: 'success' | 'progress' | 'neutral' | 'warning' }> = {
  ativa: { label: 'Activa', tone: 'success' },
  agendada: { label: 'Agendada', tone: 'progress' },
  concluida: { label: 'Concluída', tone: 'neutral' },
  pausada: { label: 'Pausada', tone: 'warning' },
};

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const meta = statusMeta[campaign.status];
  const metrics = [
    { icon: Radar, label: 'Alcance', value: formatCompact(campaign.reach) },
    { icon: MousePointerClick, label: 'Cliques', value: formatCompact(campaign.clicks) },
    { icon: Eye, label: 'Visualizações', value: formatCompact(campaign.views) },
    { icon: TrendingUp, label: 'Engagement', value: `${campaign.engagementRate}%` },
  ];

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-display text-base text-bone-100">{campaign.trackTitle}</p>
          <p className="mt-0.5 text-xs text-bone-400">{formatDate(campaign.date)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-ink-850 p-3">
            <Icon size={14} className="mb-1.5 text-bone-400" />
            <p className="font-mono-data text-sm text-bone-100">{value}</p>
            <p className="text-[11px] text-bone-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
