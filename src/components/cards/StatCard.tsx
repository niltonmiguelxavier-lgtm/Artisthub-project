import React from 'react';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  subtext?: string;
}

export default function StatCard({ label, value, icon: Icon, trend, subtext }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink-800 bg-ink-900 p-4 sm:p-5 shadow-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs sm:text-sm text-bone-400">{label}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-cobalt-400">
          <Icon size={16} strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-2.5 font-mono-data text-xl sm:text-2xl text-bone-100 truncate">{value}</p>
      {trend && (
        <p className={`mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs truncate ${trend.positive ? 'text-teal-400' : 'text-rose-400'}`}>
          {trend.positive ? <ArrowUpRight size={13} className="shrink-0" /> : <ArrowDownRight size={13} className="shrink-0" />}
          <span className="truncate">{trend.value}</span>
        </p>
      )}
      {!trend && subtext && (
        <p className="mt-1.5 text-[11px] sm:text-xs text-bone-400 truncate">{subtext}</p>
      )}
    </div>
  );
}
