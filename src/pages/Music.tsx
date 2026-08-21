import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { db, collection, query, where, getDocs, setDoc, doc, deleteDoc } from '../lib/firebase';
import MusicCard from '../components/cards/MusicCard';
import Button from '../components/ui/Button';
import AddTrackModal from '../components/AddTrackModal';
import AddVideoModal from '../components/AddVideoModal';
import EmailVerificationPromptModal from '../components/EmailVerificationPromptModal';
import EmptyState from '../components/ui/EmptyState';
import { Music2, Plus, Youtube, Disc3, Play, Trash2, ExternalLink } from 'lucide-react';
import { initialTracks } from '../data/music';
import type { Track, YouTubeVideo } from '../types';
import { getYouTubeEmbedUrl } from '../utils/youtube';

export default function Music() {
  const { artistProfile, user } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [activeTab, setActiveTab] = useState<'tracks' | 'videos'>('tracks');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [isVerifyPromptOpen, setIsVerifyPromptOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const artistId = artistProfile?.id || user?.uid || 'artist-001';
  const isPro = artistProfile?.subscriptionTier === 'pro';
  const trackLimit = isPro ? Infinity : 5;
  const isEmailVerified = !user || user.emailVerified;

  const handleOpenAddTrack = () => {
    if (!isEmailVerified) {
      setIsVerifyPromptOpen(true);
      return;
    }
    setIsAddTrackOpen(true);
  };

  const handleOpenAddVideo = () => {
    if (!isEmailVerified) {
      setIsVerifyPromptOpen(true);
      return;
    }
    setIsAddVideoOpen(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Load tracks
      const tSnap = await getDocs(query(collection(db, 'tracks'), where('artistId', '==', artistId)));
      if (!tSnap.empty) {
        const loaded = tSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
        setTracks(loaded);
      } else {
        // Fallback default tracks for smooth initial experience
        setTracks(initialTracks.map((t) => ({ ...t, artistId })));
      }

      // Load videos
      const vSnap = await getDocs(query(collection(db, 'videos'), where('artistId', '==', artistId)));
      if (!vSnap.empty) {
        const loadedV = vSnap.docs.map((d) => ({ id: d.id, ...d.data() } as YouTubeVideo));
        setVideos(loadedV);
      } else {
        setVideos([
          {
            id: 'v-1',
            artistId,
            title: 'Nélio Kaya - Noite de Verão (Ao Vivo em Maputo)',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            youtubeId: 'dQw4w9WgXcQ',
            thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            addedAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.warn('Firestore tracks load error, using initial state:', e);
      setTracks(initialTracks.map((t) => ({ ...t, artistId })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [artistId]);

  const handleTrackCreated = async (newTrackData: Partial<Track>) => {
    const trackId = 'track-' + Date.now();
    const fullTrack: Track = {
      id: trackId,
      artistId,
      title: newTrackData.title || 'Sem título',
      type: newTrackData.type || 'single',
      status: newTrackData.status || 'lancada',
      genres: newTrackData.genres || ['Afrobeat'],
      releaseDate: newTrackData.releaseDate || new Date().toISOString().split('T')[0],
      coverUrl: newTrackData.coverUrl,
      audioUrl: newTrackData.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      audioFormat: newTrackData.audioFormat || 'mp3',
      isrc: newTrackData.isrc,
      copyrightDate: newTrackData.copyrightDate,
      streams: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'tracks', trackId), fullTrack);
    } catch (e) {
      console.warn('Failed to persist track to firestore:', e);
    }

    setTracks((prev) => [fullTrack, ...prev]);
  };

  const handleVideoAdded = async (newVideoData: Omit<YouTubeVideo, 'id'>) => {
    const videoId = 'video-' + Date.now();
    const fullVideo: YouTubeVideo = {
      id: videoId,
      ...newVideoData,
    };

    try {
      await setDoc(doc(db, 'videos', videoId), fullVideo);
    } catch (e) {
      console.warn('Failed to persist video to firestore:', e);
    }

    setVideos((prev) => [fullVideo, ...prev]);
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (e) {}
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-bone-100">Catálogo Musical & Vídeos</h1>
          <p className="mt-1 text-sm text-bone-400">
            Gere as tuas faixas, lançamentos, ficheiros de áudio e videoclipes incorporados do YouTube.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'tracks' ? (
            <Button
              id="add-music-btn"
              variant="primary"
              onClick={handleOpenAddTrack}
              className="gap-2"
            >
              <Plus size={16} />
              Adicionar música
            </Button>
          ) : (
            <Button
              id="add-video-btn"
              variant="primary"
              onClick={handleOpenAddVideo}
              className="gap-2"
            >
              <Plus size={16} />
              Adicionar vídeo (YouTube)
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ink-800">
        <button
          type="button"
          onClick={() => setActiveTab('tracks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tracks'
              ? 'border-cobalt-500 text-cobalt-400'
              : 'border-transparent text-bone-400 hover:text-bone-200'
          }`}
        >
          <Music2 size={16} />
          Músicas & Faixas ({tracks.length})
          {!isPro && (
            <span className="ml-1 rounded-full bg-ink-800 px-2 py-0.5 text-[10px] text-bone-400">
              {tracks.length}/{trackLimit} no plano Grátis
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'videos'
              ? 'border-cobalt-500 text-cobalt-400'
              : 'border-transparent text-bone-400 hover:text-bone-200'
          }`}
        >
          <Youtube size={16} className="text-rose-400" />
          Vídeos YouTube ({videos.length})
        </button>
      </div>

      {/* Plan notice if free user is close to limit */}
      {!isPro && tracks.length >= 4 && activeTab === 'tracks' && (
        <div className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-300">
          <span>
            Estás a atingir o limite de 5 faixas do teu plano gratuito. Faz upgrade para PRO para uploads ilimitados.
          </span>
          <a href="/settings" className="font-semibold text-amber-400 hover:underline">
            Ver Planos
          </a>
        </div>
      )}

      {/* Content */}
      {activeTab === 'tracks' ? (
        tracks.length === 0 ? (
          <EmptyState
            title="Ainda não tens músicas"
            description="Adiciona o teu primeiro single, EP ou colaboração com ficheiro de áudio para começar."
            actionLabel="Adicionar música"
            onAction={() => setIsAddTrackOpen(true)}
          />
        ) : (
          <div className="grid gap-3">
            {tracks.map((track) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              return (
                <div
                  key={track.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-ink-800 bg-ink-900 p-4 transition-colors hover:border-ink-700"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        playTrack({
                          id: track.id,
                          title: track.title,
                          artistName: artistProfile?.stageName || 'Artista',
                          audioUrl: track.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                          coverUrl: track.coverUrl,
                        })
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-cobalt-400 transition-transform active:scale-95 hover:bg-cobalt-500 hover:text-ink-950"
                      title={isThisPlaying ? 'Pausar' : 'Ouvir faixa'}
                    >
                      {isThisPlaying ? <Disc3 size={20} className="animate-spin" /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-display text-base text-bone-100">{track.title}</h3>
                        <span className="rounded bg-ink-800 px-2 py-0.5 text-[10px] text-bone-300 uppercase tracking-wider">
                          {track.type}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-bone-400">
                        {track.status === 'lancada' ? 'Lançada' : track.status === 'agendada' ? 'Agendada' : 'Rascunho'} •{' '}
                        {track.releaseDate} {track.isrc ? `• ISRC: ${track.isrc}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-ink-800 sm:border-0 pt-3 sm:pt-0">
                    <div className="text-right">
                      <p className="font-mono-data text-xs text-bone-400">{track.streams.toLocaleString()} reproduções</p>
                      <p className="font-mono-data text-sm text-teal-400">
                        {track.revenue > 0 ? `${track.revenue.toLocaleString()} MT` : '—'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        playTrack({
                          id: track.id,
                          title: track.title,
                          artistName: artistProfile?.stageName || 'Artista',
                          audioUrl: track.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                          coverUrl: track.coverUrl,
                        })
                      }
                      className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs text-bone-200 hover:bg-cobalt-500 hover:text-ink-950"
                    >
                      {isThisPlaying ? 'A tocar' : 'Tocar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Videos Tab */
        videos.length === 0 ? (
          <EmptyState
            title="Nenhum vídeo adicionado"
            description="Partilha os teus videoclipes e atuações colando links do YouTube."
            actionLabel="Adicionar vídeo"
            onAction={() => setIsAddVideoOpen(true)}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((vid) => (
              <div key={vid.id} className="group overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
                <div className="relative aspect-video w-full bg-ink-950">
                  <iframe
                    src={getYouTubeEmbedUrl(vid.youtubeId)}
                    title={vid.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 font-display text-sm text-bone-100">{vid.title}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <a
                      href={vid.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-cobalt-400 hover:underline"
                    >
                      Ver no YouTube
                      <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="p-1 text-bone-400 hover:text-rose-400"
                      title="Remover vídeo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onTrackCreated={handleTrackCreated}
        artistId={artistId}
      />

      <AddVideoModal
        isOpen={isAddVideoOpen}
        onClose={() => setIsAddVideoOpen(false)}
        onVideoAdded={handleVideoAdded}
        artistId={artistId}
      />

      <EmailVerificationPromptModal
        isOpen={isVerifyPromptOpen}
        onClose={() => setIsVerifyPromptOpen(false)}
        actionName="adicionar faixas de música ou vídeos ao teu catálogo"
      />
    </div>
  );
}
