import React, { useState } from 'react';
import OpportunityCard from '../components/cards/OpportunityCard';
import { opportunities } from '../data/opportunities';
import type { OpportunityCategory } from '../types';

const filters: { value: OpportunityCategory | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'show', label: 'Shows' },
  { value: 'festival', label: 'Festivais' },
  { value: 'concurso', label: 'Concursos' },
  { value: 'colaboracao', label: 'Colaborações' },
  { value: 'marca', label: 'Marcas' },
  { value: 'produtor', label: 'Produtores' },
];

export default function Opportunities() {
  const [active, setActive] = useState<OpportunityCategory | 'todas'>('todas');

  const filtered = active === 'todas' ? opportunities : opportunities.filter((o) => o.category === active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Oportunidades</h1>
        <p className="mt-1 text-sm text-bone-400">Shows, festivais, concursos e colaborações à tua medida.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active === f.value
                ? 'border-brass-500 bg-brass-500/10 text-brass-400'
                : 'border-ink-700 text-bone-400 hover:text-bone-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
