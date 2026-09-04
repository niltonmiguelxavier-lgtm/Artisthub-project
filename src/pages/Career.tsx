import React, { useState } from 'react';
import ProgressCard from '../components/cards/ProgressCard';
import TaskCard from '../components/cards/TaskCard';
import ArtistHubAI from '../components/ArtistHubAI';
import { careerIndicators, nextActions } from '../data/career';
import type { Task } from '../types';

export default function Career() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('artisthub_dashboard_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return nextActions;
  });

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'concluido' ? 'pendente' : 'concluido';
          return { ...t, status: nextStatus as Task['status'] };
        }
        return t;
      });
      try {
        localStorage.setItem('artisthub_dashboard_tasks', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const completedCount = tasks.filter((t) => t.status === 'concluido').length;
  const overall = Math.round(
    careerIndicators.reduce((sum, i) => sum + i.value, 0) / careerIndicators.length
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Diagnóstico da Carreira</h1>
          <p className="mt-1 text-sm text-bone-400">
            Uma visão completa de onde estás e onde precisas de investir energia.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-cobalt-500/30 bg-cobalt-500/5 p-6">
          <p className="text-sm text-bone-300">Pontuação geral da tua carreira</p>
          <p className="mt-1 font-mono-data text-4xl text-cobalt-400">{overall}%</p>
          <p className="mt-2 text-xs text-bone-400">Ritmo de crescimento consistente</p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
          <p className="text-sm text-bone-300">Tarefas de Carreira</p>
          <p className="mt-1 font-mono-data text-4xl text-bone-100">
            {completedCount} <span className="text-lg text-bone-400">/ {tasks.length}</span>
          </p>
          <p className="mt-2 text-xs text-emerald-400">
            {Math.round((completedCount / tasks.length) * 100)}% concluídas
          </p>
        </div>
        <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
          <p className="text-sm text-bone-300">Fase Atual</p>
          <p className="mt-1 font-display text-2xl font-bold text-bone-100">Em Expansão</p>
          <p className="mt-2 text-xs text-bone-400">Pronto para monetização e eventos</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Indicators */}
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4">
            <h2 className="font-display text-lg text-bone-100">Pilares de Avaliação</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {careerIndicators.map((ind) => (
                <ProgressCard key={ind.id} indicator={ind} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-bone-100">Checklist & Ações Recomendadas</h2>
              <span className="text-xs text-bone-400">
                Clica na caixa ou no estado para marcar como concluído
              </span>
            </div>
            <div className="space-y-2.5">
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i + 1}
                  onToggleStatus={handleToggleTaskStatus}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right column: AI Advisor */}
        <div>
          <ArtistHubAI />
        </div>
      </div>
    </div>
  );
}
