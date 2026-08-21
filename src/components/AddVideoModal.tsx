import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { Youtube, AlertCircle } from 'lucide-react';
import { extractYouTubeId, getYouTubeThumbnail } from '../utils/youtube';
import type { YouTubeVideo } from '../types';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoAdded: (video: Omit<YouTubeVideo, 'id'>) => Promise<void>;
  artistId: string;
}

export default function AddVideoModal({ isOpen, onClose, onVideoAdded, artistId }: AddVideoModalProps) {
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const previewId = extractYouTubeId(youtubeUrl);
  const previewThumbnail = previewId ? getYouTubeThumbnail(previewId) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeUrl) {
      setError('Por favor preenche todos os campos.');
      return;
    }

    const yId = extractYouTubeId(youtubeUrl);
    if (!yId) {
      setError('O link do YouTube introduzido não é válido. Exemplo: https://www.youtube.com/watch?v=...');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await onVideoAdded({
        artistId,
        title,
        youtubeUrl,
        youtubeId: yId,
        thumbnailUrl: getYouTubeThumbnail(yId),
        addedAt: new Date().toISOString(),
      });

      setTitle('');
      setYoutubeUrl('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao guardar vídeo: ' + (err.message || 'Tenta novamente.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Vídeo do YouTube">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          id="video-title"
          label="Título do Vídeo *"
          placeholder="Ex: Nélio Kaya - Noite de Verão (Vídeo Oficial)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          id="video-url"
          label="Link do YouTube *"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          icon={<Youtube size={16} className="text-rose-400" />}
          required
        />

        {previewId && (
          <div className="rounded-xl border border-ink-800 bg-ink-950 p-3">
            <p className="mb-2 text-xs text-bone-400">Pré-visualização automática:</p>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <img src={previewThumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Youtube size={36} className="text-rose-500" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'A adicionar...' : 'Adicionar Vídeo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
