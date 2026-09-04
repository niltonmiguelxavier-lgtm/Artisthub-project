import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ImageUpload from '../ui/ImageUpload';
import {
  Upload,
  FileAudio,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldCheck,
  Disc3,
} from 'lucide-react';
import {
  validateAudioFile,
  uploadAudioFile,
  uploadImage,
  deleteStorageFile,
} from '../../services/storageService';
import type { Track, MusicType, MusicStatus } from '../../types';

interface EditTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onTrackUpdated: (updatedTrack: Track) => Promise<void>;
  artistId: string;
}

export default function EditTrackModal({
  isOpen,
  onClose,
  track,
  onTrackUpdated,
  artistId,
}: EditTrackModalProps) {
  if (!track) return null;

  const [title, setTitle] = useState(track.title);
  const [type, setType] = useState<MusicType>(track.type || 'single');
  const [status, setStatus] = useState<MusicStatus>(track.status || 'lancada');
  const [genres, setGenres] = useState(track.genres?.join(', ') || '');
  const [releaseDate, setReleaseDate] = useState(track.releaseDate || '');
  const [isrc, setIsrc] = useState(track.isrc || '');
  const [copyrightDate, setCopyrightDate] = useState(track.copyrightDate || '');

  // Media states
  const [audioUrl, setAudioUrl] = useState(track.audioUrl || '');
  const [audioFormat, setAudioFormat] = useState(track.audioFormat || 'mp3');
  const [duration, setDuration] = useState(track.duration || 0);
  const [coverUrl, setCoverUrl] = useState(track.coverUrl || '');

  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);

  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading_audio' | 'uploading_cover' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setType(track.type || 'single');
      setStatus(track.status || 'lancada');
      setGenres(track.genres?.join(', ') || '');
      setReleaseDate(track.releaseDate || '');
      setIsrc(track.isrc || '');
      setCopyrightDate(track.copyrightDate || '');
      setAudioUrl(track.audioUrl || '');
      setAudioFormat(track.audioFormat || 'mp3');
      setDuration(track.duration || 0);
      setCoverUrl(track.coverUrl || '');
      setNewAudioFile(null);
      setNewCoverFile(null);
      setError(null);
    }
  }, [track]);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Ficheiro de áudio inválido.');
      return;
    }

    setNewAudioFile(file);
  };

  const handleRemoveAudio = async () => {
    if (confirm('Tens a certeza que pretendes remover o ficheiro de áudio desta faixa?')) {
      if (audioUrl) {
        await deleteStorageFile(audioUrl);
      }
      setAudioUrl('');
      setNewAudioFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor introduz o título da música.');
      return;
    }

    try {
      setError(null);
      let finalAudioUrl = audioUrl;
      let finalAudioFormat = audioFormat;
      let finalDuration = duration;
      let finalCoverUrl = coverUrl;

      // 1. Upload new audio file if replaced
      if (newAudioFile) {
        setUploadStep('uploading_audio');
        setAudioProgress(5);
        const audioRes = await uploadAudioFile(newAudioFile, artistId, track.id, (pct) => {
          setAudioProgress(pct);
        });
        finalAudioUrl = audioRes.url;
        finalAudioFormat = audioRes.format;
        finalDuration = audioRes.duration || duration;
      }

      // 2. Upload new cover image if replaced
      if (newCoverFile) {
        setUploadStep('uploading_cover');
        setCoverProgress(10);
        finalCoverUrl = await uploadImage(
          newCoverFile,
          `artists/${artistId}/tracks/${track.id}/cover.webp`,
          {
            onProgress: (pct) => setCoverProgress(pct),
          }
        );
      }

      // 3. Save changes
      setUploadStep('saving');
      const updatedTrack: Track = {
        ...track,
        title: title.trim(),
        type,
        status,
        genres: genres
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
        releaseDate,
        isrc: isrc.trim() || undefined,
        copyrightDate: copyrightDate || undefined,
        audioUrl: finalAudioUrl || undefined,
        audioFormat: finalAudioFormat,
        duration: finalDuration,
        coverUrl: finalCoverUrl || undefined,
      };

      await onTrackUpdated(updatedTrack);
      setUploadStep('idle');
      onClose();
    } catch (err: any) {
      console.error('Track update failure:', err);
      setUploadStep('idle');
      setError(err.message || 'Falha ao atualizar a faixa.');
    }
  };

  const isUploading = uploadStep !== 'idle';

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? () => {} : onClose} title={`Editar Faixa: ${track.title}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <Input
          id="edit-track-title"
          label="Título da Faixa *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
          required
        />

        {/* Type & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Tipo de Lançamento *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MusicType)}
              disabled={isUploading}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            >
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Álbum</option>
              <option value="colaboracao">Colaboração</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Estado da Faixa *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MusicStatus)}
              disabled={isUploading}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            >
              <option value="lancada">Lançada (Pública)</option>
              <option value="agendada">Agendada</option>
              <option value="rascunho">Rascunho (Privada)</option>
            </select>
          </div>
        </div>

        {track.status === 'lancada' && status !== 'lancada' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <span>
              Ao alterar o estado de <strong>Lançada</strong> para <strong>{status === 'rascunho' ? 'Rascunho' : 'Agendada'}</strong>, esta música deixará de estar visível publicamente no teu perfil, no feed e no catálogo público de reprodução.
            </span>
          </div>
        )}

        {/* Genres & Release Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="edit-track-genres"
            label="Géneros (separados por vírgula)"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            disabled={isUploading}
          />
          <Input
            id="edit-track-release-date"
            label="Data de Lançamento"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            disabled={isUploading}
            required
          />
        </div>

        {/* Audio File Section (Current or Replace) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-bone-300">Ficheiro de Áudio</label>
          <div className="rounded-2xl border border-ink-800 bg-ink-950/70 p-4 space-y-3">
            {audioUrl && !newAudioFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cobalt-500/15 text-cobalt-400 shrink-0">
                    <FileAudio size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-bone-100 truncate">Ficheiro atual carregado</p>
                    <p className="text-[11px] text-bone-400 uppercase font-mono">
                      Formato {audioFormat} • {duration > 0 ? `${Math.floor(duration / 60)}:${duration % 60 < 10 ? '0' : ''}${duration % 60}` : 'Áudio pronto'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-medium text-bone-200 hover:bg-ink-700">
                    Substituir Áudio
                    <input
                      type="file"
                      accept=".mp3,.wav,audio/mpeg,audio/wav"
                      onChange={handleAudioSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="p-1.5 text-bone-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                    title="Remover ficheiro de áudio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : newAudioFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 shrink-0">
                    <FileAudio size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-teal-400 truncate">Novo ficheiro: {newAudioFile.name}</p>
                    <p className="text-[11px] text-bone-400">
                      {(newAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNewAudioFile(null)}
                  className="text-xs text-bone-400 hover:text-bone-200"
                >
                  Cancelar substituição
                </button>
              </div>
            ) : (
              <div className="text-center py-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cobalt-500/10 border border-cobalt-500/30 px-4 py-2 text-xs font-semibold text-cobalt-400 hover:bg-cobalt-500/20">
                  <Upload size={14} />
                  Carregar Ficheiro de Áudio (MP3 / WAV)
                  <input
                    type="file"
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={handleAudioSelect}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Cover Art Upload */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-bone-300">Capa da Faixa</label>
          <ImageUpload
            id="edit-track-cover"
            value={coverUrl}
            aspectRatio="square"
            onFileSelect={(file, previewUrl) => {
              setNewCoverFile(file);
              setCoverUrl(previewUrl);
            }}
            onChange={(url) => setCoverUrl(url)}
            disabled={isUploading}
            helperText="Deixa em branco ou substitui por uma nova imagem quadrada JPG/PNG/WEBP."
          />
        </div>

        {/* Professional Metadata (ISRC & Copyright) */}
        <div className="rounded-2xl border border-ink-800 bg-ink-950/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-bone-200">
            <ShieldCheck size={15} className="text-cobalt-400" />
            <span>Metadados e Direitos de Autor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="edit-track-isrc"
              label="Código ISRC"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              disabled={isUploading}
            />
            <Input
              id="edit-track-copyright"
              label="Data de Registo"
              type="date"
              value={copyrightDate}
              onChange={(e) => setCopyrightDate(e.target.value)}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Real-time Upload Progress Bar */}
        {isUploading && (
          <div className="rounded-2xl border border-cobalt-500/30 bg-cobalt-500/10 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-cobalt-300">
                <Loader2 size={14} className="animate-spin text-cobalt-400" />
                {uploadStep === 'uploading_audio' && `A carregar novo áudio (${audioProgress}%)...`}
                {uploadStep === 'uploading_cover' && `A carregar nova capa (${coverProgress}%)...`}
                {uploadStep === 'saving' && 'A atualizar faixa...'}
              </span>
              <span className="font-mono-data font-semibold text-cobalt-400">
                {uploadStep === 'uploading_audio' ? `${audioProgress}%` : uploadStep === 'uploading_cover' ? `${coverProgress}%` : '100%'}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full bg-cobalt-500 transition-all duration-300 ease-out"
                style={{
                  width: `${
                    uploadStep === 'uploading_audio'
                      ? audioProgress
                      : uploadStep === 'uploading_cover'
                      ? coverProgress
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isUploading} className="gap-2">
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                A guardar...
              </>
            ) : (
              'Guardar Alterações'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
