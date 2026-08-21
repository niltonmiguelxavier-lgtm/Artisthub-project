import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { Upload, Music, Image as ImageIcon, FileAudio, AlertCircle } from 'lucide-react';
import type { MusicType, MusicStatus, Track } from '../types';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: (track: Partial<Track>) => Promise<void>;
  artistId: string;
}

export default function AddTrackModal({ isOpen, onClose, onTrackCreated, artistId }: AddTrackModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MusicType>('single');
  const [status, setStatus] = useState<MusicStatus>('lancada');
  const [genres, setGenres] = useState('Afrobeat, Marrabenta');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isrc, setIsrc] = useState('');
  const [copyrightDate, setCopyrightDate] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Real browser file handling: creates data URL or object URL for in-app audio playback
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && extension !== 'mp3' && extension !== 'wav') {
      setError('Formato inválido. Por favor seleciona um ficheiro MP3 ou WAV.');
      return;
    }

    // 25MB max size
    if (file.size > 25 * 1024 * 1024) {
      setError('O ficheiro de áudio excede o limite máximo de 25MB.');
      return;
    }

    setError('');
    setAudioFileName(file.name);
    setAudioFormat(extension || 'mp3');

    // Read as Data URL or Object URL for permanent demo session playback
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAudioUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor seleciona uma imagem válida (JPEG/PNG/WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCoverUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Por favor introduz o título da música.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await onTrackCreated({
        artistId,
        title,
        type,
        status,
        genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        releaseDate,
        isrc: isrc || undefined,
        copyrightDate: copyrightDate || undefined,
        coverUrl: coverUrl || undefined,
        audioUrl: audioUrl || undefined,
        audioFormat,
        streams: 0,
        revenue: 0,
      });

      // Reset and close
      setTitle('');
      setCoverUrl('');
      setAudioUrl('');
      setAudioFileName('');
      setIsrc('');
      setCopyrightDate('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao guardar música: ' + (err.message || 'Tenta novamente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Música">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          id="track-title"
          label="Título da Faixa *"
          placeholder="Ex: Noite de Verão"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Tipo de Lançamento</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MusicType)}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            >
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Álbum</option>
              <option value="colaboracao">Colaboração</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MusicStatus)}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            >
              <option value="lancada">Lançada (Pública)</option>
              <option value="agendada">Agendada</option>
              <option value="rascunho">Rascunho (Privada)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="track-genres"
            label="Géneros (separados por vírgula)"
            placeholder="Afrobeat, Kizomba"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
          />
          <Input
            id="track-release-date"
            label="Data de Lançamento"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>

        {/* Informative Pro Fields */}
        <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-3.5 space-y-3">
          <p className="text-xs font-semibold text-bone-200 uppercase tracking-wider">
            Organização Profissional (Opcional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="track-isrc"
              label="Código ISRC"
              placeholder="MZ-ABC-26-00001"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
            />
            <Input
              id="track-copyright"
              label="Data de Registo de Direitos"
              type="date"
              value={copyrightDate}
              onChange={(e) => setCopyrightDate(e.target.value)}
            />
          </div>
        </div>

        {/* Audio File Upload */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-bone-300">
            Ficheiro de Áudio (MP3 ou WAV — Máx. 25MB)
          </label>
          <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-700 bg-ink-950 p-4 text-center hover:border-cobalt-500/60">
            <input
              id="track-audio-file"
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={handleAudioUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <FileAudio size={24} className="mb-2 text-cobalt-400" />
            {audioFileName ? (
              <p className="text-xs font-medium text-teal-400">✓ {audioFileName}</p>
            ) : (
              <p className="text-xs text-bone-400">
                Arrasta o ficheiro de áudio ou clica para selecionar
              </p>
            )}
          </div>
        </div>

        {/* Cover Art Upload */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-bone-300">
            Capa da Música (Imagem)
          </label>
          <div className="flex items-center gap-3">
            {coverUrl ? (
              <img src={coverUrl} alt="Capa" className="h-14 w-14 rounded-lg object-cover border border-ink-700" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-bone-400">
                <ImageIcon size={20} />
              </div>
            )}
            <div className="flex-1">
              <input
                id="track-cover-file"
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="w-full text-xs text-bone-400 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-bone-200 hover:file:bg-ink-700"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar Música'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
