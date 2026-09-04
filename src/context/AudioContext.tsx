import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Disc3, SkipBack, SkipForward } from 'lucide-react';
import { recordTrackStream } from '../services/musicService';

export interface PlayingTrack {
  id: string;
  title: string;
  artistName: string;
  artistHandle?: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: number;
  isPreview?: boolean;
}

interface AudioContextType {
  currentTrack: PlayingTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: PlayingTrack[];
  currentIndex: number;
  playTrack: (track: PlayingTrack, newQueue?: PlayingTrack[]) => void;
  playNext: () => void;
  playPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  togglePlay: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  closePlayer: () => void;
  volume: number;
  setVolume: (v: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [queue, setQueue] = useState<PlayingTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrev = currentIndex > 0;

  const playNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      playTrackInternal(nextTrack);
    }
  }, [currentIndex, queue]);

  const playPrev = useCallback(() => {
    if (currentTime > 3) {
      // If played more than 3 seconds, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      return;
    }
    if (currentIndex > 0) {
      const prevTrack = queue[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      playTrackInternal(prevTrack);
    }
  }, [currentIndex, queue, currentTime]);

  const playTrackInternal = (track: PlayingTrack) => {
    if (!audioRef.current) return;

    audioRef.current.src = track.audioUrl;
    audioRef.current.volume = volume;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        // Record stream count in Firestore with cooldown protection
        if (!track.isPreview) {
          recordTrackStream(track.id);
        }
      })
      .catch((e) => {
        console.warn('Audio autoplay note / playback:', e);
        setIsPlaying(true);
      });

    setCurrentTrack(track);
    setCurrentTime(0);
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (currentTrack?.isPreview && audio.currentTime >= 30) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Auto advance to next song in playlist if available
      if (currentIndex >= 0 && currentIndex < queue.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        playTrackInternal(queue[nextIdx]);
      }
    };

    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentTrack, currentIndex, queue]);

  const playTrack = (track: PlayingTrack, newQueue?: PlayingTrack[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((t) => t.id === track.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else if (queue.length === 0) {
      setQueue([track]);
      setCurrentIndex(0);
    } else {
      const idx = queue.findIndex((t) => t.id === track.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
      } else {
        setQueue([track, ...queue]);
        setCurrentIndex(0);
      }
    }

    if (audioRef.current) {
      if (currentTrack?.id === track.id) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
        return;
      }

      playTrackInternal(track);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {});
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        queue,
        currentIndex,
        playTrack,
        playNext,
        playPrev,
        hasNext,
        hasPrev,
        togglePlay,
        pause,
        seek,
        closePlayer,
        volume,
        setVolume,
      }}
    >
      {children}

      {/* Global Bottom Sticky Audio Player */}
      {currentTrack && (
        <div className="fixed bottom-[58px] left-0 right-0 z-40 border-t border-ink-700 bg-ink-950/95 px-3 py-2.5 backdrop-blur-md shadow-2xl transition-all duration-300 sm:px-6 lg:bottom-0">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-4">
            {/* Track Info */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 flex-1 sm:flex-initial">
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-cobalt-400 overflow-hidden shadow-inner">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="h-full w-full object-cover" />
                ) : (
                  <Disc3 size={20} className={isPlaying ? 'animate-spin' : ''} />
                )}
              </div>
              <div className="min-w-0 max-w-[140px] sm:max-w-[200px] md:max-w-[260px]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <p className="truncate text-xs sm:text-sm font-medium text-bone-100">{currentTrack.title}</p>
                  {currentTrack.isPreview && (
                    <span className="shrink-0 rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-amber-400">
                      Preview 30s
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] sm:text-xs text-bone-400">{currentTrack.artistName}</p>
              </div>
            </div>

            {/* Controls & Progress */}
            <div className="flex flex-1 max-w-md flex-col items-center gap-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={playPrev}
                  disabled={!hasPrev && currentTime <= 3}
                  title="Faixa anterior"
                  className={`p-1 text-bone-400 transition-colors ${
                    hasPrev || currentTime > 3 ? 'hover:text-bone-100 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <SkipBack size={16} />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-cobalt-500 text-ink-950 shadow-md transition-transform active:scale-95 hover:bg-cobalt-400"
                  title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={playNext}
                  disabled={!hasNext}
                  title="Próxima faixa"
                  className={`p-1 text-bone-400 transition-colors ${
                    hasNext ? 'hover:text-bone-100 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <SkipForward size={16} />
                </button>
              </div>

              <div className="flex w-full items-center gap-2 text-[10px] sm:text-xs font-mono-data text-bone-400">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={currentTrack.isPreview ? 30 : duration || 100}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="h-1 sm:h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-800 accent-cobalt-500"
                />
                <span className="w-8">{formatTime(currentTrack.isPreview ? 30 : duration)}</span>
              </div>
            </div>

            {/* Volume & Close */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="text-bone-400 hover:text-bone-200"
                >
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-ink-800 accent-cobalt-500"
                />
              </div>

              <button
                type="button"
                onClick={closePlayer}
                className="rounded-lg p-1.5 text-bone-400 hover:bg-ink-800 hover:text-bone-200"
                title="Fechar reprodutor"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
