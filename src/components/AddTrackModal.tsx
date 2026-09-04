import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import ImageUpload from './ui/ImageUpload';
import {
  Upload,
  Music,
  FileAudio,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Disc3,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { validateAudioFile, uploadAudioFile, uploadImage } from '../services/storageService';
import type { MusicType, MusicStatus, Track } from '../types';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: (track: Partial<Track>) => Promise<void>;
  artistId: string;
}

export default function AddTrackModal({
  isOpen,
  onClose,
  onTrackCreated,
  artistId,
}: AddTrackModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MusicType>('single');
  const [genres, setGenres] = useState('Afrobeat, Marrabenta');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<MusicStatus>('lancada');
  const [isrc, setIsrc] = useState('');
  const [copyrightDate, setCopyrightDate] = useState('');

  // Media files & upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading_audio' | 'uploading_cover' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Auto-determine status when release date changes
  const handleReleaseDateChange = (dateVal: string) => {
    setReleaseDate(dateVal);
    if (!dateVal) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateVal > todayStr) {
      setStatus('agendada');
    } else if (status === 'agendada') {
      setStatus('lancada');
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Ficheiro de áudio inválido.');
      return;
    }

    setAudioFile(file);
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Ficheiro de áudio inválido.');
      return;
    }

    setAudioFile(file);
  };

  const handleResetForm = () => {
    setTitle('');
    setType('single');
    setGenres('Afrobeat, Marrabenta');
    setReleaseDate(new Date().toISOString().split('T')[0]);
    setStatus('lancada');
    setIsrc('');
    setCopyrightDate('');
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreviewUrl('');
    setAudioProgress(0);
    setCoverProgress(0);
    setUploadStep('idle');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor introduz o título da música.');
      return;
    }

    if (!audioFile) {
      setError('Por favor seleciona um ficheiro de áudio (MP3 ou WAV) para carregar.');
      return;
    }

    // Generate unique trackId
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      setError(null);

      let finalAudioUrl = '';
      let finalAudioFormat = 'mp3';
      let finalDuration = 0;
      let finalCoverUrl = '';

      // 1. Upload Audio file with live progress
      setUploadStep('uploading_audio');
      setAudioProgress(5);
      const audioResult = await uploadAudioFile(audioFile, artistId, trackId, (pct) => {
        setAudioProgress(pct);
      });
      finalAudioUrl = audioResult.url;
      finalAudioFormat = audioResult.format;
      finalDuration = audioResult.duration || 0;

      // 2. Upload Cover Image if provided
      if (coverFile) {
        setUploadStep('uploading_cover');
        setCoverProgress(10);
        finalCoverUrl = await uploadImage(
          coverFile,
          `artists/${artistId}/tracks/${trackId}/cover.webp`,
          {
            onProgress: (pct) => setCoverProgress(pct),
          }
        );
      }

      // 3. Save to Firestore via onTrackCreated
      setUploadStep('saving');
      await onTrackCreated({
        id: trackId,
        artistId,
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
        audioUrl: finalAudioUrl,
        audioFormat: finalAudioFormat,
        duration: finalDuration,
        coverUrl: finalCoverUrl || undefined,
        streams: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
      });

      setUploadStep('done');
      handleResetForm();
      onClose();
    } catch (err: any) {
      console.error('Track creation & upload failure:', err);
      setUploadStep('idle');
      setError(err.message || 'Ocorreu um erro ao carregar os ficheiros. Por favor tenta novamente.');
    }
  };

  const isUploading = uploadStep !== 'idle' && uploadStep !== 'done';

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? () => {} : onClose} title="Adicionar Nova Música" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <Input
          id="track-title"
          label="Título da Faixa *"
          placeholder="Ex: Noite de Verão"
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
              <option value="lancada">Lançada (Pública no Perfil & Feed)</option>
              <option value="agendada">Agendada (Lançamento Futuro)</option>
              <option value="rascunho">Rascunho (Privada / Em Preparação)</option>
            </select>
          </div>
        </div>

        {/* Genres & Release Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="track-genres"
            label="Géneros (separados por vírgula)"
            placeholder="Afrobeat, Kizomba, Marrabenta"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            disabled={isUploading}
          />

          <Input
            id="track-release-date"
            label="Data de Lançamento *"
            type="date"
            value={releaseDate}
            onChange={(e) => handleReleaseDateChange(e.target.value)}
            disabled={isUploading}
            required
          />
        </div>

        {/* Audio File Upload Box (Validated & Real-time Progress) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-bone-300">
            Ficheiro de Áudio * (MP3 ou WAV — Máx. 25MB)
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleAudioDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center transition-all ${
              audioFile
                ? 'border-teal-500/50 bg-teal-500/5'
                : 'border-ink-700 bg-ink-950/70 hover:border-cobalt-500/60 hover:bg-ink-900/50'
            }`}
          >
            <input
              id="audio-file-input"
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
              onChange={handleAudioSelect}
              disabled={isUploading}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <FileAudio
              size={28}
              className={audioFile ? 'text-teal-400 mb-2' : 'text-cobalt-400 mb-2'}
            />

            {audioFile ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-teal-400">
                  ✓ {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
                <p className="text-[11px] text-bone-400">
                  Clica ou arrasta para substituir o ficheiro selecionado.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-bone-200">
                  Arrasta o teu ficheiro MP3/WAV ou clica para selecionar
                </p>
                <p className="text-[11px] text-bone-400">
                  Upload seguro para o Firebase Storage (/artists/{artistId}/tracks/...)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Art Upload (ImageUpload Reusable Component) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-bone-300">
            Capa da Música (Opcional — JPG, PNG, WEBP máx. 5MB)
          </label>
          <ImageUpload
            id="track-cover-upload"
            aspectRatio="square"
            onFileSelect={(file, previewUrl) => {
              setCoverFile(file);
              setCoverPreviewUrl(previewUrl);
            }}
            disabled={isUploading}
            helperText="A imagem será redimensionada e comprimida automaticamente para otimizar o carregamento."
          />
        </div>

        {/* Professional Metadata (ISRC & Copyright) */}
        <div className="rounded-2xl border border-ink-800 bg-ink-950/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-bone-200">
            <ShieldCheck size={15} className="text-cobalt-400" />
            <span>Gestão de Direitos e Metadados ISRC (Opcional)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="track-isrc"
              label="Código ISRC"
              placeholder="Ex: MZ-A01-26-00042"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              disabled={isUploading}
            />
            <Input
              id="track-copyright"
              label="Data de Registo de Direitos"
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
                {uploadStep === 'uploading_audio' && `A carregar áudio (${audioProgress}%)...`}
                {uploadStep === 'uploading_cover' && `A carregar capa (${coverProgress}%)...`}
                {uploadStep === 'saving' && 'A registar faixa no catálogo...'}
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

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isUploading} className="gap-2">
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <Upload size={15} />
                Guardar Música
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
