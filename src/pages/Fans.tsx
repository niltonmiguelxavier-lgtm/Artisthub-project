import React from 'react';
import { Users, TrendingUp, Music2, Globe2 } from 'lucide-react';
import StatCard from '../components/cards/StatCard';
import { fanStats } from '../data/fans';
import { formatCompact } from '../utils/format';

export default function Fans() {
  const maxFans = Math.max(...fanStats.weeklySeries.map((w) => w.fans));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Fãs</h1>
        <p className="mt-1 text-sm text-bone-400">Conhece a audiência que está a construir a tua carreira.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de fãs" value={formatCompact(fanStats.total)} icon={Users} trend={{ value: `+${fanStats.weeklyGrowthPct}% esta semana`, positive: true }} />
        <StatCard label="Engagement" value={`${fanStats.engagementRate}%`} icon={TrendingUp} />
        <StatCard label="Música mais popular" value={fanStats.mostPopularTrack} icon={Music2} />
        <StatCard label="Países" value={`${fanStats.topCountries.length}`} icon={Globe2} />
      </div>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-display text-lg text-bone-100">Crescimento semanal</h2>
        <div className="flex items-end gap-3" style={{ height: 140 }}>
          {fanStats.weeklySeries.map((w) => (
            <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-cobalt-500/70"
                style={{ height: `${(w.fans / maxFans) * 100}%` }}
              />
              <span className="text-[11px] text-bone-400">{w.week}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
        <h2 className="mb-4 font-display text-lg text-bone-100">Onde estão os teus fãs</h2>
        <div className="space-y-3">
          {fanStats.topCountries.map((c) => (
            <div key={c.country}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-bone-300">{c.country}</span>
                <span className="font-mono-data text-bone-400">{c.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-ink-800">
                <div className="h-2 rounded-full bg-teal-500" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
