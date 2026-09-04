import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db, collection, getDocs, query, where } from '../lib/firebase';
import { useAudio, type PlayingTrack } from '../context/AudioContext';
import Button from '../components/ui/Button';
import PageLoadingError from '../components/ui/PageLoadingError';
import {
  Music2,
  Play,
  Pause,
  Search,
  Disc3,
  Sparkles,
  Share2,
  ListFilter,
  Radio,
  Shuffle,
  Volume2,
  Clock,
  Check,
  LayoutGrid,
  List,
  ExternalLink,
} from 'lucide-react';
import { featuredArtists } from '../data/artists';
import type { Track, Artist } from '../types';

interface ExtendedTrack extends Track {
  artistName?: string;
  artistHandle?: string;
  artistAvatarUrl?: string;
  artistVerified?: boolean;
}

const GENRES = [
  'Todos',
  'Afrobeat',
  'Marrabenta',
  'Amapiano',
  'Pandza',
  'Kizomba',
  'R&B',
  'House',
  'Hip-Hop',
  'Gospel',
];

export default function Listen() {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio();
  const [tracks, setTracks] = useState<ExtendedTrack[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'az'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null);

  const loadData = async () => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    try {
      setStatus('loading');
      setError(null);

      timer = setTimeout(() => {
        if (!cancelled && status === 'loading') {
          setError('O carregamento está a demorar mais do que o esperado.');
          setStatus('error');
        }
      }, 15000);

      // 1. Fetch artists for metadata enrichment
      const artistsMap = new Map<string, Artist>();
      featuredArtists.forEach((a) => artistsMap.set(a.id, a));

      try {
        const artSnap = await getDocs(collection(db, 'artists'));
        artSnap.forEach((docSnap) => {
          const a = { id: docSnap.id, ...docSnap.data() } as Artist;
          artistsMap.set(a.id, a);
        });
      } catch (e) {
        console.warn('Artists cache notice:', e);
      }

      // 2. Fetch released tracks from Firestore
      const tracksRef = collection(db, 'tracks');
      const q = query(tracksRef, where('status', '==', 'lancada'));
      const snap = await getDocs(q);

      let loadedTracks: ExtendedTrack[] = [];

      if (!snap.empty) {
        loadedTracks = snap.docs.map((d) => {
          const data = d.data() as Track;
          const artist = artistsMap.get(data.artistId);
          return {
            id: d.id,
            ...data,
            artistName: data.artistName || artist?.stageName || 'Artista Moçambicano',
            artistHandle: data.artistHandle || artist?.handle || 'artista',
            artistAvatarUrl: artist?.avatarUrl,
            artistVerified: artist?.verified,
          };
        });
      }

      // Merge with default released seed tracks if platform has fewer tracks
      const defaultTracks: ExtendedTrack[] = [
        {
          id: 'track-seed-1',
          artistId: 'artist-001',
          artistName: 'Nélio Kaya',
          artistHandle: 'nelio-kaya',
          title: 'Prometo Te Amar',
          type: 'single',
          releaseDate: '2026-05-12',
          streams: 128400,
          revenue: 0,
          status: 'lancada',
          genres: ['Afrobeat', 'R&B'],
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          duration: 214,
        },
        {
          id: 'track-seed-2',
          artistId: 'artist-001',
          artistName: 'Nélio Kaya',
          artistHandle: 'nelio-kaya',
          title: 'Horizonte',
          type: 'single',
          releaseDate: '2026-02-03',
          streams: 96200,
          revenue: 0,
          status: 'lancada',
          genres: ['Marrabenta', 'Afrobeat'],
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          duration: 198,
        },
        {
          id: 'track-seed-3',
          artistId: 'artist-002',
          artistName: 'Ivy Cumbane',
          artistHandle: 'ivy-cumbane',
          title: 'Balanço da Beira',
          type: 'single',
          releaseDate: '2026-04-18',
          streams: 84300,
          revenue: 0,
          status: 'lancada',
          genres: ['Amapiano', 'House'],
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          duration: 240,
        },
        {
          id: 'track-seed-4',
          artistId: 'artist-003',
          artistName: 'Dj Zavala',
          artistHandle: 'dj-zavala',
          title: 'Batida de Tete',
          type: 'single',
          releaseDate: '2026-03-22',
          streams: 71500,
          revenue: 0,
          status: 'lancada',
          genres: ['Pandza', 'Afro House'],
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
          duration: 185,
        },
      ];

      const combined = [...loadedTracks];
      defaultTracks.forEach((dt) => {
        if (!combined.some((t) => t.id === dt.id || t.title.toLowerCase() === dt.title.toLowerCase())) {
          combined.push(dt);
        }
      });

      if (!cancelled) {
        setTracks(combined);
        setStatus('success');
      }
    } catch (err: any) {
      if (!cancelled) {
        console.warn('Tracks fetch fallback:', err);
        setStatus('success');
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort tracks
  const filteredTracks = useMemo(() => {
    return tracks
      .filter((t) => {
        const matchesSearch =
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.artistName?.toLowerCase().includes(search.toLowerCase()) ||
          t.genres?.some((g) => g.toLowerCase().includes(search.toLowerCase()));

        const matchesGenre =
          selectedGenre === 'Todos' ||
          t.genres?.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()));

        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          return (b.streams || 0) - (a.streams || 0);
        }
        if (sortBy === 'recent') {
          return new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [tracks, search, selectedGenre, sortBy]);

  // Transform tracks to Queue format
  const audioQueue: PlayingTrack[] = useMemo(() => {
    return filteredTracks
      .filter((t) => Boolean(t.audioUrl))
      .map((t) => ({
        id: t.id,
        title: t.title,
        artistName: t.artistName || 'Artista',
        artistHandle: t.artistHandle,
        audioUrl: t.audioUrl!,
        coverUrl: t.coverUrl,
        duration: t.duration,
      }));
  }, [filteredTracks]);

  const handlePlaySingle = (track: ExtendedTrack) => {
    if (!track.audioUrl) return;

    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    const playingTrack: PlayingTrack = {
      id: track.id,
      title: track.title,
      artistName: track.artistName || 'Artista',
      artistHandle: track.artistHandle,
      audioUrl: track.audioUrl,
      coverUrl: track.coverUrl,
      duration: track.duration,
    };

    playTrack(playingTrack, audioQueue);
  };

  const handlePlayAll = () => {
    if (audioQueue.length > 0) {
      playTrack(audioQueue[0], audioQueue);
    }
  };

  const handleShufflePlay = () => {
    if (audioQueue.length > 0) {
      const shuffled = [...audioQueue].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  const handleCopyShare = (track: ExtendedTrack) => {
    const shareUrl = `${window.location.origin}/artist/${track.artistHandle || 'artista'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedTrackId(track.id);
      setTimeout(() => setCopiedTrackId(null), 2500);
    }
  };

  const formatSeconds = (secs?: number) => {
    if (!secs || isNaN(secs)) return '3:30';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-16">
      {/* Hero Discovery Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-950 to-cobalt-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cobalt-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cobalt-500/30 bg-cobalt-500/10 px-3 py-1 text-xs font-semibold text-cobalt-300">
              <Sparkles size={14} className="text-cobalt-400" />
              <span>Streaming Oficial ArtistHub</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-bone-100 tracking-tight">
              Ouve a Música de Moçambique
            </h1>
            <p className="text-sm text-bone-300 leading-relaxed">
              Explora o catálogo público de faixas originais, singles e lançamentos independentes carregados diretamente pelos artistas.
            </p>
          </div>

          {/* Quick Play Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={audioQueue.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-cobalt-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-lg shadow-cobalt-500/20 transition-all hover:bg-cobalt-400 active:scale-95 disabled:opacity-50"
            >
              <Play size={16} fill="currentColor" />
              <span>Reproduzir Tudo ({audioQueue.length})</span>
            </button>

            <button
              type="button"
              onClick={handleShufflePlay}
              disabled={audioQueue.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-800/80 px-4 py-3 text-sm font-medium text-bone-200 backdrop-blur transition-colors hover:bg-ink-700 hover:text-bone-100 disabled:opacity-50"
              title="Reproduzir em ordem aleatória"
            >
              <Shuffle size={16} />
              <span className="hidden sm:inline">Aleatório</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-2xl border border-ink-800 bg-ink-900/70 p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-400" />
            <input
              type="text"
              placeholder="Pesquisar por título, artista ou género musical..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-ink-700 bg-ink-950/90 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-bone-100 placeholder-bone-400 focus:border-cobalt-500 focus:outline-none"
            />
          </div>

          {/* Sort and View controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-bone-400">
              <ListFilter size={14} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-ink-700 bg-ink-950 px-3 py-2 text-xs font-medium text-bone-200 focus:border-cobalt-500 focus:outline-none"
              >
                <option value="popular">Mais Ouvidas</option>
                <option value="recent">Mais Recentes</option>
                <option value="az">Título (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-ink-700 bg-ink-950 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-ink-800 text-cobalt-400' : 'text-bone-400 hover:text-bone-200'
                }`}
                title="Vista em Grelha"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition-colors ${
                  viewMode === 'list' ? 'bg-ink-800 text-cobalt-400' : 'text-bone-400 hover:text-bone-200'
                }`}
                title="Vista em Lista"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Genre Tags Scrollable Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(g)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                selectedGenre === g
                  ? 'bg-cobalt-500 text-ink-950 font-semibold shadow-md shadow-cobalt-500/20'
                  : 'bg-ink-800/80 text-bone-300 hover:bg-ink-700 hover:text-bone-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Content */}
      {status === 'loading' ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-bone-400 text-xs">
          <Disc3 size={28} className="animate-spin text-cobalt-400" />
          <span>A carregar catálogo de reprodução...</span>
        </div>
      ) : status === 'error' ? (
        <PageLoadingError error={error} onRetry={loadData} />
      ) : filteredTracks.length === 0 ? (
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-12 text-center space-y-3">
          <Music2 size={32} className="mx-auto text-bone-500" />
          <p className="text-sm font-semibold text-bone-200">Nenhuma música encontrada</p>
          <p className="text-xs text-bone-400 max-w-sm mx-auto">
            Não foram encontradas faixas para o termo "{search}" no género "{selectedGenre}".
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setSelectedGenre('Todos');
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredTracks.map((track) => {
            const isThisCurrent = currentTrack?.id === track.id;
            const isThisPlaying = isThisCurrent && isPlaying;

            return (
              <div
                key={track.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-ink-900/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                  isThisPlaying
                    ? 'border-cobalt-500 ring-2 ring-cobalt-500/20 bg-ink-900 shadow-panel'
                    : 'border-ink-800 hover:border-ink-700'
                }`}
              >
                {/* Artwork & Play Button overlay */}
                <div className="relative aspect-square w-full overflow-hidden bg-ink-950">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-ink-950 text-bone-500">
                      <Disc3 size={40} className={isThisPlaying ? 'animate-spin text-cobalt-400' : ''} />
                    </div>
                  )}

                  {/* Play button overlay */}
                  <button
                    type="button"
                    onClick={() => handlePlaySingle(track)}
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                      isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title={isThisPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-transform active:scale-90 ${
                        isThisPlaying ? 'bg-cobalt-500 text-ink-950' : 'bg-cobalt-500 text-ink-950 hover:scale-110'
                      }`}
                    >
                      {isThisPlaying ? (
                        <Pause size={20} fill="currentColor" />
                      ) : (
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                      )}
                    </div>
                  </button>

                  {/* Audio format badge */}
                  {track.audioFormat && (
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[9px] font-mono font-medium text-bone-300 uppercase backdrop-blur">
                      {track.audioFormat}
                    </span>
                  )}

                  {/* Equalizer animation indicator if playing */}
                  {isThisPlaying && (
                    <div className="absolute top-2.5 right-2.5 flex items-end gap-0.5 rounded-md bg-cobalt-500/90 px-1.5 py-1 backdrop-blur">
                      <span className="h-2 w-0.5 animate-pulse bg-ink-950 rounded-full" />
                      <span className="h-3 w-0.5 animate-bounce bg-ink-950 rounded-full" />
                      <span className="h-1.5 w-0.5 animate-pulse bg-ink-950 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold text-bone-100 group-hover:text-cobalt-400 transition-colors">
                      {track.title}
                    </h3>

                    {/* Artist Link */}
                    <Link
                      to={`/artist/${track.artistHandle || 'artista'}`}
                      className="truncate text-xs text-bone-400 hover:text-bone-200 flex items-center gap-1 transition-colors mt-0.5"
                    >
                      <span>{track.artistName}</span>
                      {track.artistVerified && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" title="Verificado" />
                      )}
                    </Link>
                  </div>

                  {/* Footer stats: Streams, Duration & Share */}
                  <div className="flex items-center justify-between border-t border-ink-800/80 pt-2 text-[11px] font-mono-data text-bone-400">
                    <div className="flex items-center gap-1">
                      <Disc3 size={11} className="text-cobalt-400" />
                      <span>{track.streams ? track.streams.toLocaleString() : '0'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>{formatSeconds(track.duration)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyShare(track)}
                        className="text-bone-400 hover:text-bone-200 transition-colors"
                        title="Partilhar perfil do artista"
                      >
                        {copiedTrackId === track.id ? (
                          <Check size={12} className="text-teal-400" />
                        ) : (
                          <Share2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="divide-y divide-ink-800 rounded-2xl border border-ink-800 bg-ink-900/80 overflow-hidden">
          {filteredTracks.map((track, idx) => {
            const isThisCurrent = currentTrack?.id === track.id;
            const isThisPlaying = isThisCurrent && isPlaying;

            return (
              <div
                key={track.id}
                className={`flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 transition-colors ${
                  isThisPlaying ? 'bg-cobalt-500/10' : 'hover:bg-ink-800/50'
                }`}
              >
                {/* Left: Index / Play button & info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handlePlaySingle(track)}
                    className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                      isThisPlaying
                        ? 'bg-cobalt-500 text-ink-950'
                        : 'bg-ink-800 text-cobalt-400 hover:bg-cobalt-500 hover:text-ink-950'
                    }`}
                  >
                    {track.coverUrl && !isThisPlaying ? (
                      <div className="relative h-full w-full overflow-hidden rounded-xl">
                        <img src={track.coverUrl} alt={track.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <Play size={16} fill="currentColor" className="ml-0.5 text-bone-100" />
                        </div>
                      </div>
                    ) : isThisPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm font-semibold ${isThisPlaying ? 'text-cobalt-400' : 'text-bone-100'}`}>
                        {track.title}
                      </p>
                      {track.type && (
                        <span className="hidden sm:inline-block rounded bg-ink-800 px-1.5 py-0.5 text-[9px] font-mono text-bone-400 uppercase">
                          {track.type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-bone-400 mt-0.5">
                      <Link
                        to={`/artist/${track.artistHandle || 'artista'}`}
                        className="hover:text-bone-200 transition-colors"
                      >
                        {track.artistName}
                      </Link>
                      {track.genres && track.genres.length > 0 && (
                        <span className="hidden md:inline text-bone-500">• {track.genres.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Streams, Duration & Link */}
                <div className="flex items-center gap-4 text-xs font-mono-data text-bone-400 shrink-0">
                  <div className="hidden sm:flex items-center gap-1">
                    <Disc3 size={13} className="text-cobalt-400" />
                    <span>{track.streams ? track.streams.toLocaleString() : '0'}</span>
                  </div>

                  <span>{formatSeconds(track.duration)}</span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyShare(track)}
                      className="p-1.5 text-bone-400 hover:text-bone-200 rounded-lg hover:bg-ink-800"
                      title="Copiar ligação"
                    >
                      {copiedTrackId === track.id ? <Check size={14} className="text-teal-400" /> : <Share2 size={14} />}
                    </button>

                    <Link
                      to={`/artist/${track.artistHandle || 'artista'}`}
                      className="p-1.5 text-bone-400 hover:text-bone-200 rounded-lg hover:bg-ink-800"
                      title="Ver perfil completo do artista"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
