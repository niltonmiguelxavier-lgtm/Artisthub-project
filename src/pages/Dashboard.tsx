import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, collection, getDocs, query, where } from '../lib/firebase';
import StatCard from '../components/cards/StatCard';
import ProgressCard from '../components/cards/ProgressCard';
import TaskCard from '../components/cards/TaskCard';
import ArtistHubAI from '../components/ArtistHubAI';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageLoadingError from '../components/ui/PageLoadingError';
import {
  Users,
  Music2,
  Wallet,
  ListTodo,
  ExternalLink,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { careerIndicators, nextActions } from '../data/career';
import { tracks as fallbackTracks } from '../data/music';
import { formatCurrency } from '../utils/format';
import type { Track, CareerIndicator, Task } from '../types';

export default function Dashboard() {
  const { artistProfile, user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('artisthub_dashboard_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return nextActions;
  });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const artistId = artistProfile?.id || user?.uid || 'artist-001';
  const stageName = artistProfile?.stageName || user?.email?.split('@')[0] || 'Artista';
  const handle = artistProfile?.handle || 'nelio-kaya';
  const isPro = artistProfile?.subscriptionTier === 'pro';

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
        // ignore storage error
      }
      return updated;
    });
  };

  const loadData = async () => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    try {
      setStatus('loading');
      setError(null);

      timer = setTimeout(() => {
        if (!cancelled && status === 'loading') {
          setError('Isto está a demorar mais do que o esperado. Tenta novamente.');
          setStatus('error');
        }
      }, 15000);

      const snap = await getDocs(query(collection(db, 'tracks'), where('artistId', '==', artistId)));
      if (!cancelled) {
        if (!snap.empty) {
          setTracks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Track)));
        } else {
          setTracks(fallbackTracks.map((t) => ({ ...t, artistId })));
        }
        setStatus('success');
      }
    } catch (e: any) {
      if (!cancelled) {
        console.warn('Dashboard fetch tracks fallback:', e);
        setTracks(fallbackTracks.map((t) => ({ ...t, artistId })));
        setStatus('success');
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    loadData();
  }, [artistId]);

  const releasedTracks = tracks.filter((t) => t.status === 'lancada');
  const pendingTasksCount = tasks.filter((t) => t.status !== 'concluido').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'concluido').length;

  // Dynamic career indicator calculation based on released tracks, showing all 5 indicators
  const dynamicIndicators: CareerIndicator[] = careerIndicators.map((ind) => {
    if (ind.id === 'ci-1' || ind.label.toLowerCase().includes('música')) {
      const calculatedValue = Math.min(100, Math.max(ind.value, releasedTracks.length * 20));
      return { ...ind, value: calculatedValue };
    }
    return ind;
  });

  return (
    <div className="space-y-8 min-w-0 max-w-full">
      {/* 
        ══════════════════════════════════════════════════════════════════
        1. SAUDAÇÃO PERSONALIZADA + BOTÕES DE AÇÃO
        ══════════════════════════════════════════════════════════════════
      */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">
              Olá, {stageName} 👋
            </h1>
            {isPro && (
              <Badge tone="cobalt">
                <Sparkles size={12} className="mr-1 inline" /> PRO
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-bone-400">
            Aqui está o resumo da tua carreira musical e progresso no ArtistHub.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link to={`/artist/${handle}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm">
              Ver perfil público
              <ExternalLink size={14} />
            </Button>
          </Link>
          <Link to="/music">
            <Button variant="primary" size="sm" className="gap-1.5 font-medium text-xs sm:text-sm">
              <Plus size={14} />
              Nova Música
            </Button>
          </Link>
        </div>
      </div>

      {status === 'error' && (
        <PageLoadingError error={error} onRetry={loadData} />
      )}

      {/* 
        ══════════════════════════════════════════════════════════════════
        2. GRELHA DE ESTATÍSTICAS (2x2 MOBILE / 4 COLUNAS DESKTOP)
        Sem duplicação de dados dos indicadores de carreira
        ══════════════════════════════════════════════════════════════════
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Músicas Lançadas"
          value={releasedTracks.length.toString()}
          icon={Music2}
          subtext={`${tracks.length} no catálogo`}
        />
        <StatCard
          label="Total de Fãs"
          value={(artistProfile?.followers || 12480).toLocaleString()}
          icon={Users}
          trend={{ value: '+14% este mês', positive: true }}
        />
        <StatCard
          label="Receita Disponível"
          value={formatCurrency(48250)}
          icon={Wallet}
          subtext="Saldo pronto a levantar"
        />
        <StatCard
          label="Ações Pendentes"
          value={pendingTasksCount.toString()}
          icon={ListTodo}
          subtext={`${completedTasksCount} de ${tasks.length} concluídas`}
        />
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════════
        3. INDICADORES DE CARREIRA (TODOS OS 5 INDICADORES COM WAVEFORMS)
        ══════════════════════════════════════════════════════════════════
      */}
      <section className="space-y-4 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 sm:p-6 shadow-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg text-bone-100">Indicadores de Carreira</h2>
            <p className="text-xs text-bone-400">
              Calculado automaticamente com base no teu catálogo, lançamentos, promoção e organização.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/career" className="text-xs text-cobalt-400 hover:text-cobalt-300 font-medium inline-flex items-center gap-1 transition-colors">
              Ver diagnóstico completo <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Grelha com os 5 indicadores */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {dynamicIndicators.map((ind) => (
            <ProgressCard key={ind.id} indicator={ind} />
          ))}
        </div>

        {/* Atalho simples para catálogo de música, sem repetir lista de faixas */}
        <div className="pt-2 border-t border-ink-800/80 flex items-center justify-between text-xs text-bone-400">
          <span>Gestão de catálogo e lançamentos musicais</span>
          <Link
            to="/music"
            className="text-xs text-cobalt-400 hover:text-cobalt-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            Ver catálogo de música →
          </Link>
        </div>
      </section>

      {/* 
        ══════════════════════════════════════════════════════════════════
        4. PRÓXIMAS AÇÕES (LISTA DE TAREFAS DE CARREIRA)
        ══════════════════════════════════════════════════════════════════
      */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-bone-100">Próximas Ações</h2>
            <p className="text-xs text-bone-400">
              Passos recomendados para acelerar o desenvolvimento da tua carreira musical.
            </p>
          </div>
          <span className="rounded-full border border-ink-800 bg-ink-900 px-3 py-1 text-xs text-bone-300 font-mono-data">
            {completedTasksCount}/{tasks.length} concluídas
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

      {/* 
        ══════════════════════════════════════════════════════════════════
        5. WIDGET ARTISTHUB AI (ASSISTENTE VIRTUAL COM SELO EM BREVE)
        ══════════════════════════════════════════════════════════════════
      */}
      <section aria-label="Assistente Virtual ArtistHub AI">
        <ArtistHubAI />
      </section>
    </div>
  );
}
