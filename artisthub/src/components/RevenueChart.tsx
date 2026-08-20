import React from 'react';
import type { RevenuePoint } from '../types';
import { formatCurrency } from '../utils/format';

interface RevenueChartProps {
  data: RevenuePoint[];
  height?: number;
}

// A dependency-free SVG bar chart. Keeps the bundle lean and avoids
// pulling in a charting library for a single, simple visualization.
export default function RevenueChart({ data, height = 200 }: RevenueChartProps) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const barWidth = 100 / data.length;

  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((point, i) => {
          const barHeight = (point.amount / max) * (height - 28);
          const x = i * barWidth + barWidth * 0.2;
          const w = barWidth * 0.6;
          const y = height - 28 - barHeight;
          return (
            <g key={point.month}>
              <rect x={x} y={y} width={w} height={barHeight} rx={1.5} fill="#D4A24E" opacity={i === data.length - 1 ? 1 : 0.55} />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-bone-400">
        {data.map((point) => (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-0.5">
            <span>{point.month}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-bone-400">
        Último mês: <span className="font-mono-data text-brass-400">{formatCurrency(data[data.length - 1]?.amount ?? 0)}</span>
      </p>
    </div>
  );
}
