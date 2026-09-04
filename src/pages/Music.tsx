import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from '../lib/firebase';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AddTrackModal from '../components/AddTrackModal';
import EditTrackModal from '../components/music/EditTrackModal';
import AddVideoModal from '../components/AddVideoModal';
import EmailVerificationPromptModal from '../components/EmailVerificationPromptModal';
import TrackListItem from '../components/music/TrackListItem';
import EmptyState from '../components/ui/EmptyState';
import PageLoadingError from '../components/ui/PageLoadingError';
import {
  Music2,
  Plus,
  Youtube,
  Disc3,
  Trash2,
  Edit2,
  ExternalLink,
  Crown,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { initialTracks } from '../data/music';
import { createFeedPost } from '../services/feedService';
import { deleteTrackWithProtection, checkTrackHasStoreSales } from '../services/musicService';
import type { Track, YouTubeVideo } from '../types';
import { getYouTubeEmbedUrl } from '../utils/youtube';

export default function Music() {
  const { artistProfile, user } = useAuth();
  const { closePlayer, currentTrack } = useAudio();
  const [activeTab, setActiveTab] = useState<'tracks' | 'videos'>('tracks');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lancada' | 'agendada' | 'rascunho'>('all');

  // Modals state
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [isVerifyPromptOpen, setIsVerifyPromptOpen] = useState(false);

  // Deletion modal state
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<YouTubeVideo | null>(null);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const artistId = artistProfile?.id || user?.uid || 'artist-001';
  const artistName = artistProfile?.stageName || user?.displayName || 'Artista';
  const artistHandle = artistProfile?.handle || 'artista';
  const isPro = artistProfile?.subscriptionTier === 'pro';
  const trackLimit = isPro ? Infinity : 5;
  const isEmailVerified = !user || user.emailVerified;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddTrack = () => {
    if (!isEmailVerified) {
      setIsVerifyPromptOpen(true);
      return;
    }
    if (!isPro && tracks.length >= 5) {
      showNotification('Atingiste o limite de 5 músicas do teu plano gratuito. Faz upgrade para PRO para uploads ilimitados.', 'error');
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

      // Load tracks from Firestore
      const tSnap = await getDocs(query(collection(db, 'tracks'), where('artistId', '==', artistId)));
      if (!cancelled) {
        if (!tSnap.empty) {
          const loaded = tSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
          setTracks(loaded);
        } else {
          setTracks(initialTracks.map((t) => ({ ...t, artistId, artistName, artistHandle })));
        }
      }

      // Load videos from Firestore
      const vSnap = await getDocs(query(collection(db, 'videos'), where('artistId', '==', artistId)));
      if (!cancelled) {
        if (!vSnap.empty) {
          const loadedV = vSnap.docs.map((d) => ({ id: d.id, ...d.data() } as YouTubeVideo));
          setVideos(loadedV);
        } else {
          setVideos([
            {
              id: 'v-1',
              artistId,
              title: `${artistName} - Noite de Verão (Ao Vivo em Maputo)`,
              youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              youtubeId: 'dQw4w9WgXcQ',
              thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
              addedAt: new Date().toISOString(),
            },
          ]);
        }
        setStatus('success');
      }
    } catch (e: any) {
      if (!cancelled) {
        console.warn('Firestore load notice, utilizing local cache:', e);
        setTracks(initialTracks.map((t) => ({ ...t, artistId, artistName, artistHandle })));
        setStatus('success');
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    loadData();
  }, [artistId]);

  // Create new track
  const handleTrackCreated = async (newTrackData: Partial<Track>) => {
    const trackId = newTrackData.id || `track_${Date.now()}`;
    const fullTrack: Track = {
      id: trackId,
      artistId,
      artistName,
      artistHandle,
      title: newTrackData.title || 'Sem título',
      type: newTrackData.type || 'single',
      status: newTrackData.status || 'lancada',
      genres: newTrackData.genres || ['Afrobeat'],
      releaseDate: newTrackData.releaseDate || new Date().toISOString().split('T')[0],
      coverUrl: newTrackData.coverUrl,
      audioUrl: newTrackData.audioUrl || '',
      audioFormat: newTrackData.audioFormat || 'mp3',
      duration: newTrackData.duration || 0,
      isrc: newTrackData.isrc,
      copyrightDate: newTrackData.copyrightDate,
      streams: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'tracks', trackId), fullTrack);

      // Automatically publish to Community Feed if track is launched
      if (fullTrack.status === 'lancada') {
        createFeedPost({
          artistId,
          artistName,
          artistHandle,
          artistAvatarUrl: artistProfile?.avatarUrl,
          artistVerified: artistProfile?.verified || false,
          type: 'musica',
          content: `🎵 Novo lançamento: "${fullTrack.title}" (${fullTrack.type.toUpperCase()}) já se encontra disponível para streaming!`,
          mediaUrl: fullTrack.coverUrl,
          relatedId: trackId,
          metadata: {
            trackTitle: fullTrack.title,
            audioUrl: fullTrack.audioUrl,
            audioFormat: fullTrack.audioFormat,
          },
        }).catch((err) => console.warn('Could not auto-post track to feed:', err));
      }

      setTracks((prev) => [fullTrack, ...prev]);
      showNotification(`Música "${fullTrack.title}" carregada e adicionada com sucesso!`);
    } catch (e: any) {
      console.warn('Failed to persist track to firestore:', e);
      setTracks((prev) => [fullTrack, ...prev]);
      showNotification(`Música "${fullTrack.title}" adicionada.`);
    }
  };

  // Update existing track
  const handleTrackUpdated = async (updatedTrack: Track) => {
    try {
      await updateDoc(doc(db, 'tracks', updatedTrack.id), {
        ...updatedTrack,
        artistName: updatedTrack.artistName || artistName,
        artistHandle: updatedTrack.artistHandle || artistHandle,
        updatedAt: new Date().toISOString(),
      });

      setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
      showNotification(`Faixa "${updatedTrack.title}" atualizada com sucesso.`);
    } catch (e: any) {
      console.warn('Failed to update track in firestore:', e);
      setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
      showNotification(`Faixa "${updatedTrack.title}" atualizada.`);
    }
  };

  // Request deletion of a track (triggers verification dialog)
  const handlePromptDeleteTrack = async (track: Track) => {
    setTrackToDelete(track);
    setDeleteBlockedReason(null);
    setDeleteChecking(true);

    try {
      const check = await checkTrackHasStoreSales(track.id, track.title);
      if (check.hasSales) {
        setDeleteBlockedReason(check.reason || 'Esta música tem vendas ativas na Loja.');
      }
    } catch (e) {
      console.warn('Store check error:', e);
    } finally {
      setDeleteChecking(false);
    }
  };

  // Confirm track deletion
  const handleConfirmDeleteTrack = async () => {
    if (!trackToDelete) return;
    setIsDeleting(true);

    try {
      // 1. If currently playing, stop player
      if (currentTrack?.id === trackToDelete.id) {
        closePlayer();
      }

      // 2. Perform protected deletion (checks store and cleans storage)
      const res = await deleteTrackWithProtection(artistId, trackToDelete.id, trackToDelete.title);
      if (!res.success) {
        showNotification(res.error || 'Erro ao eliminar faixa.', 'error');
        setIsDeleting(false);
        return;
      }

      // 3. Update UI
      setTracks((prev) => prev.filter((t) => t.id !== trackToDelete.id));
      showNotification(`Faixa "${trackToDelete.title}" eliminada permanentemente.`);
      setTrackToDelete(null);
    } catch (err: any) {
      console.error('Track deletion error:', err);
      showNotification('Erro ao remover faixa. Tenta novamente.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add YouTube video
  const handleVideoAdded = async (newVideoData: Omit<YouTubeVideo, 'id'>) => {
    const videoId = `video_${Date.now()}`;
    const fullVideo: YouTubeVideo = {
      id: videoId,
      ...newVideoData,
    };

    try {
      await setDoc(doc(db, 'videos', videoId), fullVideo);

      // Automatically publish to Community Feed
      createFeedPost({
        artistId,
        artistName,
        artistHandle,
        artistAvatarUrl: artistProfile?.avatarUrl,
        artistVerified: artistProfile?.verified || false,
        type: 'video',
        content: `🎬 Novo vídeo do YouTube adicionado: "${fullVideo.title}". Assiste agora ao vídeo oficial!`,
        mediaUrl: fullVideo.thumbnailUrl,
        relatedId: videoId,
        metadata: {
          youtubeId: fullVideo.youtubeId,
          youtubeUrl: fullVideo.youtubeUrl,
        },
      }).catch((err) => console.warn('Could not auto-post video to feed:', err));

      setVideos((prev) => [fullVideo, ...prev]);
      showNotification(`Vídeo "${fullVideo.title}" adicionado ao teu catálogo!`);
    } catch (e) {
      console.warn('Failed to persist video to firestore:', e);
      setVideos((prev) => [fullVideo, ...prev]);
      showNotification(`Vídeo "${fullVideo.title}" adicionado.`);
    }
  };

  // Update YouTube video
  const handleVideoUpdated = async (updatedVideo: YouTubeVideo) => {
    try {
      await updateDoc(doc(db, 'videos', updatedVideo.id), {
        title: updatedVideo.title,
        youtubeUrl: updatedVideo.youtubeUrl,
        youtubeId: updatedVideo.youtubeId,
        thumbnailUrl: updatedVideo.thumbnailUrl,
        updatedAt: new Date().toISOString(),
      });

      setVideos((prev) => prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)));
      showNotification(`Vídeo "${updatedVideo.title}" atualizado.`);
    } catch (e) {
      setVideos((prev) => prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)));
      showNotification(`Vídeo "${updatedVideo.title}" atualizado.`);
    }
  };

  // Confirm video deletion
  const handleConfirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'videos', videoToDelete.id));
      setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      showNotification(`Vídeo "${videoToDelete.title}" removido com sucesso.`);
      setVideoToDelete(null);
    } catch (e) {
      setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
      showNotification('Vídeo removido.');
      setVideoToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-bone-100">Catálogo Musical & Vídeos</h1>
          <p className="mt-1 text-sm text-bone-400">
            Gere as tuas faixas, substitui capas/áudios, consulta reproduções e adiciona videoclipes do YouTube.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'tracks' ? (
            <Button
              id="add-music-btn"
              variant="primary"
              onClick={handleOpenAddTrack}
              className="gap-2 shadow-lg shadow-cobalt-500/10"
            >
              <Plus size={16} />
              Adicionar música
            </Button>
          ) : (
            <Button
              id="add-video-btn"
              variant="primary"
              onClick={handleOpenAddVideo}
              className="gap-2 shadow-lg shadow-rose-500/10"
            >
              <Plus size={16} />
              Adicionar vídeo (YouTube)
            </Button>
          )}
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-xs shadow-panel transition-all ${
            notification.type === 'success'
              ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

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
            <span className="ml-1 rounded-full bg-ink-800 px-2 py-0.5 text-[10px] text-bone-400 font-mono">
              {tracks.length}/{trackLimit}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-400 shrink-0" />
            <span>
              Estás a atingir o limite de 5 faixas do teu plano gratuito ({tracks.length}/5 utilizadas).
            </span>
          </div>
          <a
            href="/settings"
            className="rounded-lg bg-amber-400/20 px-3 py-1 font-semibold text-amber-300 hover:bg-amber-400/30 transition-colors"
          >
            Fazer Upgrade para PRO
          </a>
        </div>
      )}

      {/* Tab 1: Tracks List with Custom HTML5 Player */}
      {activeTab === 'tracks' ? (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          {tracks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 p-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, género ou tipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950/80 pl-9 pr-4 py-2 text-xs text-bone-100 placeholder-bone-400 focus:border-cobalt-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'lancada', 'agendada', 'rascunho'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-cobalt-500 text-ink-950 font-semibold'
                        : 'bg-ink-800 text-bone-300 hover:bg-ink-700'
                    }`}
                  >
                    {st === 'all' ? 'Todas' : st === 'lancada' ? 'Lançadas' : st === 'agendada' ? 'Agendadas' : 'Rascunhos'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-bone-400">
              <RefreshCw size={22} className="animate-spin text-cobalt-400" />
              <span>A carregar catálogo de músicas...</span>
            </div>
          ) : status === 'error' ? (
            <PageLoadingError error={error} onRetry={loadData} />
          ) : tracks.length === 0 ? (
            <EmptyState
              title="Ainda não tens músicas no catálogo"
              description="Faz upload de áudio (MP3/WAV) e imagem de capa do teu primeiro single, EP ou álbum."
              actionLabel="Adicionar primeira música"
              onAction={handleOpenAddTrack}
            />
          ) : filteredTracks.length === 0 ? (
            <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-8 text-center text-xs text-bone-400">
              Nenhuma música corresponde aos filtros selecionados.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTracks.map((track) => (
                <TrackListItem
                  key={track.id}
                  track={track}
                  artistName={artistName}
                  artistHandle={artistHandle}
                  onEdit={(t) => setEditingTrack(t)}
                  onDelete={(t) => handlePromptDeleteTrack(t)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: YouTube Videos Grid */
        <div>
          {status === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-bone-400">
              <RefreshCw size={22} className="animate-spin text-rose-400" />
              <span>A carregar vídeos do YouTube...</span>
            </div>
          ) : status === 'error' ? (
            <PageLoadingError error={error} onRetry={loadData} />
          ) : videos.length === 0 ? (
            <EmptyState
              title="Nenhum vídeo adicionado"
              description="Partilha os teus videoclipes e atuações ao vivo colando links do YouTube."
              actionLabel="Adicionar vídeo"
              onAction={handleOpenAddVideo}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 transition-all hover:border-ink-700"
                >
                  <div className="relative aspect-video w-full bg-ink-950">
                    <iframe
                      src={getYouTubeEmbedUrl(vid.youtubeId)}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                    <h3 className="line-clamp-2 font-display text-sm font-semibold text-bone-100">
                      {vid.title}
                    </h3>

                    <div className="flex items-center justify-between border-t border-ink-800/80 pt-3">
                      <a
                        href={vid.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-cobalt-400 hover:underline"
                      >
                        Ver no YouTube
                        <ExternalLink size={12} />
                      </a>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingVideo(vid)}
                          className="flex items-center gap-1 rounded-lg p-1.5 text-bone-400 hover:bg-ink-800 hover:text-bone-200 transition-colors"
                          title="Editar vídeo"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoToDelete(vid)}
                          className="flex items-center gap-1 rounded-lg p-1.5 text-bone-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Remover vídeo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Track Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(trackToDelete)}
        onClose={() => !isDeleting && setTrackToDelete(null)}
        title="Eliminar Faixa do Catálogo"
        size="md"
      >
        <div className="space-y-4">
          {deleteChecking ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-xs text-bone-400">
              <Loader2 size={20} className="animate-spin text-cobalt-400" />
              <span>A verificar associações com a Loja Oficial...</span>
            </div>
          ) : deleteBlockedReason ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                <ShieldAlert size={20} className="shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-300">Eliminação Bloqueada por Segurança</p>
                  <p>{deleteBlockedReason}</p>
                </div>
              </div>
              <p className="text-xs text-bone-400">
                Para manter a integridade das compras e permitir que os fãs continuem a descarregar os seus produtos comprados, vai até à página <strong>Loja</strong> e remove ou desativa o produto antes de eliminar a faixa.
              </p>
              <div className="flex justify-end pt-3">
                <Button type="button" variant="primary" onClick={() => setTrackToDelete(null)}>
                  Compreendido
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200">
                <AlertTriangle size={20} className="shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-300">Eliminação Permanente</p>
                  <p>
                    Tens a certeza que pretendes eliminar a faixa <strong>"{trackToDelete?.title}"</strong>?
                  </p>
                  <p className="text-rose-300/80">
                    O ficheiro de áudio e a capa associada serão apagados do Firebase Storage. Esta ação é irreversível.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-ink-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTrackToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleConfirmDeleteTrack}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      A eliminar...
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Eliminar Faixa
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Video Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(videoToDelete)}
        onClose={() => !isDeleting && setVideoToDelete(null)}
        title="Remover Vídeo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-bone-300">
            Tens a certeza que pretendes remover o vídeo <strong>"{videoToDelete?.title}"</strong> do teu catálogo de vídeos?
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-ink-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setVideoToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteVideo}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  A remover...
                </>
              ) : (
                'Remover Vídeo'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modals */}
      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onTrackCreated={handleTrackCreated}
        artistId={artistId}
      />

      <EditTrackModal
        isOpen={Boolean(editingTrack)}
        onClose={() => setEditingTrack(null)}
        track={editingTrack}
        onTrackUpdated={handleTrackUpdated}
        artistId={artistId}
      />

      <AddVideoModal
        isOpen={isAddVideoOpen || Boolean(editingVideo)}
        onClose={() => {
          setIsAddVideoOpen(false);
          setEditingVideo(null);
        }}
        onVideoAdded={handleVideoAdded}
        onVideoUpdated={handleVideoUpdated}
        editingVideo={editingVideo}
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

