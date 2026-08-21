import React from 'react';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import type { Opportunity, OpportunityCategory } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/format';

const categoryLabel: Record<OpportunityCategory, string> = {
  show: 'Show',
  festival: 'Festival',
  concurso: 'Concurso',
  colaboracao: 'Colaboração',
  marca: 'Marca',
  produtor: 'Produtor',
};

export interface OpportunityCardProps {
  opportunity: Opportunity;
  key?: React.Key;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Badge tone="progress">{categoryLabel[opportunity.category]}</Badge>
      </div>
      <p className="font-display text-lg leading-snug text-bone-100">{opportunity.title}</p>
      <p className="mt-0.5 text-sm text-bone-400">{opportunity.organization}</p>
      <p className="mt-3 text-sm text-bone-300">{opportunity.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-bone-400">
        <span className="flex items-center gap-1.5">
          <MapPin size={13} /> {opportunity.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={13} /> {formatDate(opportunity.date)}
        </span>
      </div>

      <Button variant="outline" size="sm" className="mt-5 self-start" icon={<ArrowRight size={14} />} iconPosition="right">
        Ver oportunidade
      </Button>
    </div>
  );
}
