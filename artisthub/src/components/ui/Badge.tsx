import React from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'progress' | 'brass';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-800 text-bone-300 border-ink-700',
  success: 'bg-teal-500/10 text-teal-400 border-teal-600/40',
  warning: 'bg-clay-500/10 text-clay-400 border-clay-500/40',
  progress: 'bg-brass-500/10 text-brass-400 border-brass-500/40',
  brass: 'bg-brass-500 text-ink-950 border-transparent',
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
