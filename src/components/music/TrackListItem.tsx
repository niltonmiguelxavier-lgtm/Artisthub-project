import React from 'react';
import { useAudio } from '../../context/AudioContext';
import {
  Play,
  Pause,
  Disc3,
  Edit2,
  Trash2,
  FileAudio,
  Clock,
  ExternalLink,
} from 'lucide-react';
import type { Track } from '../../types';

interface TrackListItemProps {
  key?: React.Key;
  track: Track;
  artistName: string;
  artistHandle?: string;
  onEdit: (track: Track) => void;
  onDelete: (track: Track) => void;
}

export default function TrackListItem({
  track,
  artistName,
  artistHandle,
  onEdit,
  onDelete,
}: TrackListItemProps) {
  const { playTrack, togglePlay, currentTrack, isPlaying, currentTime, duration, seek } = useAudio();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisPlaying = isCurrentTrack && isPlaying;

  const handlePlayToggle = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack({
        id: track.id,
        title: track.title,
        artistName: track.artistName || artistName,
        artistHandle: track.artistHandle || artistHandle,
        audioUrl: track.audioUrl || '',
        coverUrl: track.coverUrl,
        duration: track.duration,
      });
    }
  };

  const formatSeconds = (secs?: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusBadge = () => {
    switch (track.status) {
      case 'lancada':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-[11px] font-medium text-teal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            Lançada
          </span>
        );
      case 'agendada':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
            <Clock size={11} />
            Agendada ({track.releaseDate})
          </span>
        );
      case 'rascunho':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-800 border border-ink-700 px-2.5 py-0.5 text-[11px] font-medium text-bone-400">
            Rascunho
          </span>
        );
    }
  };

  const trackProgressPercent =
    isCurrentTrack && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isThisPlaying
          ? 'border-cobalt-500/70 bg-ink-900 shadow-panel'
          : 'border-ink-800 bg-ink-900/90 hover:border-ink-700 hover:bg-ink-900'
      }`}
    >
      {/* Dynamic playback background bar */}
      {isCurrentTrack && (
        <div
          className="absolute bottom-0 left-0 top-0 bg-cobalt-500/[0.03] transition-all duration-200 pointer-events-none"
          style={{ width: `${trackProgressPercent}%` }}
        />
      )}

      <div className="relative p-4 sm:p-5 flex flex-col gap-4">
        {/* Top row: Cover, Title, Badges & Play Action */}
        <div className="flex items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Custom Interactive Player Button */}
            <button
              type="button"
              onClick={handlePlayToggle}
              disabled={!track.audioUrl}
              className={`relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 ${
                !track.audioUrl
                  ? 'bg-ink-800/60 text-bone-400 cursor-not-allowed opacity-60'
                  : isThisPlaying
                  ? 'bg-cobalt-500 text-ink-950 shadow-lg shadow-cobalt-500/25 ring-2 ring-cobalt-400/40'
                  : 'bg-ink-800 text-cobalt-400 hover:bg-cobalt-500 hover:text-ink-950'
              }`}
              title={
                !track.audioUrl
                  ? 'Sem ficheiro de áudio associado'
                  : isThisPlaying
                  ? 'Pausar reprodução'
                  : 'Reproduzir faixa'
              }
            >
              {track.coverUrl && !isThisPlaying ? (
                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} fill="currentColor" className="ml-0.5 text-bone-100" />
                  </div>
                </div>
              ) : isThisPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            {/* Track Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-display text-base font-semibold text-bone-100">
                  {track.title}
                </h3>
                <span className="rounded bg-ink-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bone-300">
                  {track.type}
                </span>
                {track.audioFormat && (
                  <span className="rounded bg-cobalt-500/10 border border-cobalt-500/20 px-1.5 py-0.5 text-[10px] font-mono font-medium text-cobalt-400 uppercase">
                    {track.audioFormat}
                  </span>
                )}
                {getStatusBadge()}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-bone-400">
                {track.genres && track.genres.length > 0 && (
                  <span>{track.genres.join(', ')}</span>
                )}
                <span>• Lançamento: {track.releaseDate}</span>
                {track.isrc && <span className="font-mono">ISRC: {track.isrc}</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons (Public link / Edit / Delete) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {track.status === 'lancada' && (
              <a
                href={artistHandle ? `/artist/${artistHandle}` : '/listen'}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl bg-ink-800/80 px-2.5 text-xs text-bone-300 transition-colors hover:bg-ink-700 hover:text-bone-100"
                title="Ver no perfil público"
              >
                <ExternalLink size={13} />
                <span>Público</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => onEdit(track)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-800/80 text-bone-300 transition-colors hover:bg-ink-700 hover:text-bone-100"
              title="Editar faixa"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(track)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-800/80 text-bone-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
              title="Remover faixa"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Custom Audio Player Controls Bar */}
        {track.audioUrl ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-ink-800/80 pt-3.5">
            {/* Custom Interactive Waveform / Slider */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="font-mono-data text-xs text-bone-400 w-10 text-right">
                {isCurrentTrack ? formatSeconds(currentTime) : '0:00'}
              </span>

              <div className="relative flex-1 flex items-center group/slider">
                <input
                  type="range"
                  min="0"
                  max={isCurrentTrack && duration > 0 ? duration : track.duration || 180}
                  value={isCurrentTrack ? currentTime : 0}
                  onChange={(e) => {
                    if (isCurrentTrack) {
                      seek(Number(e.target.value));
                    } else {
                      handlePlayToggle();
                    }
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-800 accent-cobalt-500 transition-all hover:h-2.5 focus:outline-none"
                />
              </div>

              <span className="font-mono-data text-xs text-bone-400 w-10">
                {formatSeconds(isCurrentTrack && duration > 0 ? duration : track.duration)}
              </span>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono-data text-bone-400">
              <div className="flex items-center gap-1.5">
                <Disc3 size={14} className="text-cobalt-400" />
                <span>{track.streams.toLocaleString()} reproduções</span>
              </div>
              {track.revenue > 0 && (
                <div className="text-teal-400 font-semibold">
                  {track.revenue.toLocaleString()} MT
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-t border-ink-800/80 pt-3 text-xs text-amber-400/80">
            <FileAudio size={14} />
            <span>Nenhum ficheiro de áudio carregado. Clica em editar para adicionar áudio a esta faixa.</span>
          </div>
        )}
      </div>
    </div>
  );
}

