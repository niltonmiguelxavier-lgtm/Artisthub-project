import React from 'react';
import type { CareerIndicator } from '../../types';

export interface ProgressCardProps {
  indicator: CareerIndicator;
  barCount?: number;
  key?: React.Key;
}

// Renders the indicator's percentage as a waveform meter — ArtistHub's
// signature visual — rather than a generic rounded progress bar.
export default function ProgressCard({ indicator, barCount = 24 }: ProgressCardProps) {
  const filledCount = Math.round((indicator.value / 100) * barCount);
  // Deterministic pseudo-random heights per indicator so each waveform looks distinct.
  const heights = Array.from({ length: barCount }, (_, i) => {
    const seed = (indicator.id.charCodeAt(indicator.id.length - 1) + i * 13) % 100;
    return 30 + (seed % 70); // 30%–100% height
  });

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-bone-100">{indicator.label}</h4>
        <span className="font-mono-data text-sm text-cobalt-400">{indicator.value}%</span>
      </div>
      <p className="mb-3 text-xs text-bone-400">{indicator.description}</p>
      <div className="waveform">
        {heights.map((h, i) => (
          <div
            key={i}
            className="waveform-bar"
            data-filled={i < filledCount}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
