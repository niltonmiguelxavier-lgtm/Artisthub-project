import React from 'react';
import { Link } from 'react-router-dom';
import { Circle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Task } from '../../types';
import Badge from '../ui/Badge';

const statusMeta: Record<
  Task['status'],
  { label: string; tone: 'neutral' | 'progress' | 'success'; icon: React.ReactNode }
> = {
  pendente: { label: 'Pendente', tone: 'neutral', icon: <Circle size={13} /> },
  em_progresso: { label: 'Em progresso', tone: 'progress', icon: <Clock size={13} /> },
  concluido: { label: 'Concluído', tone: 'success', icon: <CheckCircle2 size={13} /> },
};

const taskActionLinks: Record<string, { to: string; label: string }> = {
  'task-1': { to: '/settings', label: 'Editar Perfil' },
  'task-2': { to: '/music', label: 'Gerir Músicas' },
  'task-3': { to: '/promotion', label: 'Criar Campanha' },
  'task-4': { to: '/settings', label: 'Adicionar Redes' },
  'task-5': { to: '/store', label: 'Configurar Loja' },
};

export interface TaskCardProps {
  task: Task;
  index: number;
  onToggleStatus?: (taskId: string) => void;
  key?: React.Key;
}

export default function TaskCard({ task, index, onToggleStatus }: TaskCardProps) {
  const meta = statusMeta[task.status];
  const isCompleted = task.status === 'concluido';
  const action = taskActionLinks[task.id];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(task.id);
    }
  };

  return (
    <div
      className={`group relative flex items-start gap-3.5 rounded-2xl border p-4 transition-all duration-200 ${
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-950/10'
          : 'border-ink-800 bg-ink-900 hover:border-ink-700 hover:bg-ink-850/80'
      }`}
    >
      {/* Interactive Toggle Checkbox Button */}
      <button
        type="button"
        onClick={handleToggle}
        title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
          isCompleted
            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            : 'bg-ink-800 text-bone-400 hover:bg-cobalt-500/20 hover:text-cobalt-400'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
          <span className="font-mono-data text-xs font-semibold">{index}</span>
        )}
      </button>

      {/* Task Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium transition-colors ${
              isCompleted ? 'text-bone-400 line-through' : 'text-bone-100'
            }`}
          >
            {task.title}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-bone-400">{task.description}</p>

        {/* Quick Action Link */}
        {action && (
          <div className="mt-2.5 flex items-center gap-3">
            <Link
              to={action.to}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cobalt-400 hover:text-cobalt-300 transition-colors"
            >
              <span>{action.label}</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Status Badge (Clickable to cycle status) */}
      <button
        type="button"
        onClick={handleToggle}
        title="Alternar estado da tarefa"
        className="cursor-pointer transition-transform hover:scale-105"
      >
        <Badge tone={meta.tone}>
          {meta.icon}
          {meta.label}
        </Badge>
      </button>
    </div>
  );
}
