import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Disc3 } from 'lucide-react';

export interface PlayingTrack {
  id: string;
  title: string;
  artistName: string;
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
  playTrack: (track: PlayingTrack) => void;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  }, [currentTrack]);

  const playTrack = (track: PlayingTrack) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
        return;
      }

      audioRef.current.src = track.audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio autoplay prevented or file format issue', e);
        setIsPlaying(true);
      });
      setCurrentTrack(track);
      setCurrentTime(0);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
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
        playTrack,
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
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink-700 bg-ink-950/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-cobalt-400 overflow-hidden">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="h-full w-full object-cover" />
                ) : (
                  <Disc3 size={22} className={isPlaying ? 'animate-spin' : ''} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-bone-100">{currentTrack.title}</p>
                  {currentTrack.isPreview && (
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                      Preview 30s
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-bone-400">{currentTrack.artistName}</p>
              </div>
            </div>

            {/* Controls & Progress */}
            <div className="flex flex-1 max-w-md flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt-500 text-ink-950 transition-transform active:scale-95 hover:bg-cobalt-400"
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
              </div>

              <div className="flex w-full items-center gap-2 text-xs font-mono-data text-bone-400">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={currentTrack.isPreview ? 30 : duration || 100}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-800 accent-cobalt-500"
                />
                <span>{formatTime(currentTrack.isPreview ? 30 : duration)}</span>
              </div>
            </div>

            {/* Volume & Close */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
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
