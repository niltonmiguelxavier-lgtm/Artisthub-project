import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles, Image as ImageIcon, Link2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ArtistAvatar from '../ArtistAvatar';
import Button from '../ui/Button';
import { createFeedPost } from '../../services/feedService';
import type { FeedPost } from '../../types';

interface FeedComposerProps {
  onPostCreated: (post: FeedPost) => void;
}

const MAX_CHARS = 500;

export default function FeedComposer({ onPostCreated }: FeedComposerProps) {
  const { user, artistProfile } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-r from-ink-900 to-ink-950 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cobalt-400" />
              <p className="font-display font-medium text-bone-100 text-sm sm:text-base">
                És artista ou produtor? Junta-te à comunidade!
              </p>
            </div>
            <p className="text-xs text-bone-400">
              Cria a tua conta no ArtistHub para partilhares músicas, vídeos, novidades e reagires às publicações.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link to="/login" className="flex-1 sm:flex-initial">
              <Button size="sm" variant="secondary" className="w-full text-xs">
                Entrar
              </Button>
            </Link>
            <Link to="/register" className="flex-1 sm:flex-initial">
              <Button size="sm" variant="primary" className="w-full text-xs">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const charsLeft = MAX_CHARS - content.length;
  const isTooLong = charsLeft < 0;
  const isPostEmpty = !content.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostEmpty) {
      setError('Por favor escreve alguma novidade antes de publicar.');
      return;
    }

    if (isTooLong) {
      setError(`A publicação excede o limite máximo de ${MAX_CHARS} caracteres.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const newPost = await createFeedPost({
        artistId: artistProfile?.id || user.uid,
        artistName: artistProfile?.stageName || user.displayName || 'Artista',
        artistHandle: artistProfile?.handle || 'artista',
        artistAvatarUrl: artistProfile?.avatarUrl || undefined,
        artistVerified: artistProfile?.verified || false,
        type: 'texto',
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      });

      onPostCreated(newPost);

      // Reset form
      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao publicar novidade: ' + (err.message || 'Tenta novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cobalt-500/30 bg-gradient-to-b from-ink-900 via-ink-900 to-ink-950 p-4 sm:p-5 shadow-lg ring-1 ring-cobalt-500/15">
      <div className="mb-3 flex items-center justify-between border-b border-ink-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cobalt-500/20 text-cobalt-400">
            <Sparkles size={13} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-cobalt-300">
            Criar Publicação
          </span>
        </div>
        <span className="text-[11px] text-bone-400">
          Visível no Feed para fãs e artistas
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-400">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <ArtistAvatar
            name={artistProfile?.stageName || user.displayName || 'Artista'}
            size={40}
            verified={artistProfile?.verified}
            imageUrl={artistProfile?.avatarUrl}
          />

          <div className="flex-1 min-w-0">
            <textarea
              id="feed-composer-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partilha uma novidade com os teus fãs (ex: no estúdio, novas datas de concertos, prévias)..."
              maxLength={MAX_CHARS + 50}
              className="w-full resize-none rounded-xl border border-ink-700/80 bg-ink-950 px-3.5 py-2.5 text-sm text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:ring-1 focus:ring-cobalt-500/30 focus:outline-none transition-all"
            />
          </div>
        </div>

        {showMediaInput && (
          <div className="rounded-xl border border-ink-800 bg-ink-950 p-3">
            <label className="mb-1 block text-xs font-medium text-bone-300">
              Link de Imagem ou Mídia Externa (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="feed-composer-media-url"
                type="url"
                placeholder="https://images.unsplash.com/... ou link de imagem"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:outline-none"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMediaUrl('');
                  setShowMediaInput(false);
                }}
                className="text-xs text-bone-400"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-ink-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaInput((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-bone-400 hover:bg-ink-800 hover:text-bone-200 transition-colors"
            >
              <ImageIcon size={14} className="text-cobalt-400" />
              <span>{showMediaInput ? 'Ocultar imagem' : 'Adicionar imagem'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono-data ${
                isTooLong
                  ? 'text-rose-400 font-bold'
                  : charsLeft < 50
                  ? 'text-amber-400'
                  : 'text-bone-400'
              }`}
            >
              {charsLeft} restantes
            </span>

            <Button
              id="feed-publish-btn"
              type="submit"
              size="sm"
              variant="primary"
              disabled={isPostEmpty || isTooLong || isSubmitting}
              className="gap-1.5 text-xs"
            >
              <Send size={13} />
              {isSubmitting ? 'A publicar...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
