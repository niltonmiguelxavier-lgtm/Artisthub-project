import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'progress' | 'cobalt' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  tone?: Tone;
  className?: string;
  key?: React.Key;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-800 text-bone-300 border-ink-700',
  success: 'bg-teal-500/10 text-teal-400 border-teal-600/40',
  warning: 'bg-amber-400/10 text-amber-400 border-amber-400/40',
  progress: 'bg-cobalt-500/10 text-cobalt-400 border-cobalt-500/40',
  cobalt: 'bg-cobalt-500 text-ink-950 border-transparent',
  danger: 'bg-rose-400/10 text-rose-400 border-rose-400/40',
};

export default function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
