import React from 'react';
import { Music2 } from 'lucide-react';
import type { Track } from '../../types';
import Badge from '../ui/Badge';
import { formatCompact, formatCurrency, formatDate } from '../../utils/format';

const statusMeta: Record<Track['status'], { label: string; tone: 'success' | 'progress' | 'neutral' }> = {
  lancada: { label: 'Lançada', tone: 'success' },
  agendada: { label: 'Agendada', tone: 'progress' },
  rascunho: { label: 'Rascunho', tone: 'neutral' },
};

const typeLabel: Record<Track['type'], string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Álbum',
  colaboracao: 'Colaboração',
};

export interface MusicCardProps {
  track: Track;
  key?: React.Key;
}

export default function MusicCard({ track }: MusicCardProps) {
  const meta = statusMeta[track.status];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink-800 bg-ink-900 p-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-cobalt-400">
        <Music2 size={22} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-bone-100">{track.title}</p>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
        <p className="mt-1 text-xs text-bone-400">
          {typeLabel[track.type]} · {formatDate(track.releaseDate)}
        </p>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono-data text-sm text-bone-100">{formatCompact(track.streams)}</p>
        <p className="text-xs text-bone-400">streams</p>
      </div>
      <div className="hidden shrink-0 text-right md:block">
        <p className="font-mono-data text-sm text-teal-400">{formatCurrency(track.revenue)}</p>
        <p className="text-xs text-bone-400">receita</p>
      </div>
    </div>
  );
}
