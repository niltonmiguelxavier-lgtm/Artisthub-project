import React from 'react';
import ProgressCard from '../components/cards/ProgressCard';
import { careerIndicators } from '../data/career';

export default function Career() {
  const overall = Math.round(
    careerIndicators.reduce((sum, i) => sum + i.value, 0) / careerIndicators.length
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Diagnóstico da carreira</h1>
        <p className="mt-1 text-sm text-bone-400">
          Uma visão completa de onde estás e onde precisas de investir energia.
        </p>
      </div>

      <div className="rounded-2xl border border-brass-500/30 bg-brass-500/5 p-6">
        <p className="text-sm text-bone-300">Pontuação geral da tua carreira</p>
        <p className="mt-1 font-mono-data text-4xl text-brass-400">{overall}%</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {careerIndicators.map((ind) => (
          <ProgressCard key={ind.id} indicator={ind} />
        ))}
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6 text-sm text-bone-400">
        Em breve, o <span className="text-brass-400">ArtistHub AI</span> vai gerar recomendações
        personalizadas com base nestes indicadores.
      </div>
    </div>
  );
}
