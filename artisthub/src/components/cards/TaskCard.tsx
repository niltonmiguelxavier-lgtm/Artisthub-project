import React from 'react';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import type { Task } from '../../types';
import Badge from '../ui/Badge';

const statusMeta: Record<Task['status'], { label: string; tone: 'neutral' | 'progress' | 'success'; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', tone: 'neutral', icon: <Circle size={13} /> },
  em_progresso: { label: 'Em progresso', tone: 'progress', icon: <Clock size={13} /> },
  concluido: { label: 'Concluído', tone: 'success', icon: <CheckCircle2 size={13} /> },
};

interface TaskCardProps {
  task: Task;
  index: number;
}

export default function TaskCard({ task, index }: TaskCardProps) {
  const meta = statusMeta[task.status];
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-ink-800 bg-ink-900 p-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-800 font-mono-data text-xs text-bone-400">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-bone-100">{task.title}</p>
        <p className="mt-0.5 text-xs text-bone-400">{task.description}</p>
      </div>
      <Badge tone={meta.tone}>
        {meta.icon}
        {meta.label}
      </Badge>
    </div>
  );
}
