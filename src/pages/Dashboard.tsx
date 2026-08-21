import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { db, collection, getDocs, query, where } from '../lib/firebase';
import StatCard from '../components/cards/StatCard';
import ProgressCard from '../components/cards/ProgressCard';
import TaskCard from '../components/cards/TaskCard';
import ArtistHubAI from '../components/ArtistHubAI';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  Users,
  Music2,
  TrendingUp,
  Wallet,
  Play,
  Disc3,
  ExternalLink,
  Plus,
  Compass,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { careerIndicators, nextActions } from '../data/career';
import { tracks as fallbackTracks } from '../data/music';
import { formatCurrency } from '../utils/format';
import type { Track, CareerIndicator } from '../types';

export default function Dashboard() {
  const { artistProfile, user } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [tracks, setTracks] = useState<Track[]>([]);

  const artistId = artistProfile?.id || user?.uid || 'artist-001';
  const stageName = artistProfile?.stageName || user?.email?.split('@')[0] || 'Artista';
  const handle = artistProfile?.handle || 'nelio-kaya';
  const isPro = artistProfile?.subscriptionTier === 'pro';

  useEffect(() => {
    const loadData = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'tracks'), where('artistId', '==', artistId)));
        if (!snap.empty) {
          setTracks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Track)));
        } else {
          setTracks(fallbackTracks.map((t) => ({ ...t, artistId })));
        }
      } catch (e) {
        setTracks(fallbackTracks.map((t) => ({ ...t, artistId })));
      }
    };
    loadData();
  }, [artistId]);

  const releasedTracks = tracks.filter((t) => t.status === 'lancada');

  // Dynamic career indicator calculation based on released tracks
  const dynamicIndicators: CareerIndicator[] = careerIndicators.map((ind) => {
    if (ind.id === 'ci-1' || ind.label.toLowerCase().includes('música')) {
      const calculatedValue = Math.min(100, Math.max(ind.value, releasedTracks.length * 20));
      return { ...ind, value: calculatedValue };
    }
    return ind;
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
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

        <div className="flex items-center gap-3">
          <Link to={`/artist/${handle}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              Ver perfil público
              <ExternalLink size={14} />
            </Button>
          </Link>
          <Link to="/music">
            <Button variant="primary" size="sm" className="gap-1.5 font-medium">
              <Plus size={14} />
              Nova Música
            </Button>
          </Link>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Músicas Lançadas"
          value={releasedTracks.length.toString()}
          icon={Music2}
          subtext={`${tracks.length} faixas no total`}
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
          label="Carreira & Saúde"
          value="82%"
          icon={TrendingUp}
          subtext="Ritmo de crescimento alto"
        />
      </div>

      {/* Career Waveform Progress and Recommended Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Waveform Career Score */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-bone-100">Indicadores de Carreira</h2>
                <p className="text-xs text-bone-400">
                  Calculado automaticamente com base no teu catálogo, lançamentos e atividade.
                </p>
              </div>
              <Link to="/career" className="text-xs text-cobalt-400 hover:underline">
                Ver diagnóstico completo →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {dynamicIndicators.slice(0, 4).map((ind) => (
                <ProgressCard key={ind.id} indicator={ind} />
              ))}
            </div>
          </section>

          {/* Recent Tracks List with Audio Player Trigger */}
          <section className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-bone-100">Faixas Recentes</h2>
              <Link to="/music" className="text-xs text-cobalt-400 hover:underline">
                Gerir catálogo ({tracks.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {tracks.slice(0, 3).map((track) => {
                const isPlayingThis = currentTrack?.id === track.id && isPlaying;
                return (
                  <div
                    key={track.id}
                    className="flex items-center justify-between rounded-xl border border-ink-800 bg-ink-950/50 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          playTrack({
                            id: track.id,
                            title: track.title,
                            artistName: stageName,
                            audioUrl: track.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                            coverUrl: track.coverUrl,
                          })
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-cobalt-400 hover:bg-cobalt-500 hover:text-ink-950 transition-colors"
                      >
                        {isPlayingThis ? <Disc3 size={18} className="animate-spin" /> : <Play size={18} className="ml-0.5" />}
                      </button>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-bone-100">{track.title}</p>
                        <p className="truncate text-xs text-bone-400">
                          {track.type.toUpperCase()} • {track.status === 'lancada' ? 'Lançada' : 'Rascunho'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono-data text-xs text-bone-400">
                        {track.streams.toLocaleString()} reproduções
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column: Action tasks & AI recommendation */}
        <div className="space-y-6">
          <ArtistHubAI />

          <section className="space-y-3">
            <h2 className="font-display text-lg text-bone-100">Próximos Passos</h2>
            <div className="space-y-2">
              {nextActions.slice(0, 3).map((task, i) => (
                <TaskCard key={task.id} task={task} index={i + 1} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
