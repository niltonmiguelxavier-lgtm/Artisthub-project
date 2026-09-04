import React, { useState } from 'react';
import { Send, Sparkles, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ArtistAvatar from '../ArtistAvatar';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { createFeedPost } from '../../services/feedService';
import type { FeedPost } from '../../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: FeedPost) => void;
}

const MAX_CHARS = 500;

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const { user, artistProfile } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const charsLeft = MAX_CHARS - content.length;
  const isTooLong = charsLeft < 0;
  const isPostEmpty = !content.trim();

  const handleRequestClose = () => {
    if (content.trim().length > 0 || mediaUrl.trim().length > 0) {
      if (window.confirm('Tens a certeza que queres descartar esta publicação?')) {
        setContent('');
        setMediaUrl('');
        setShowMediaInput(false);
        setError('');
        onClose();
      }
    } else {
      setError('');
      onClose();
    }
  };

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
        artistId: artistProfile?.id || user?.uid || 'anon',
        artistName: artistProfile?.stageName || user?.displayName || 'Artista',
        artistHandle: artistProfile?.handle || 'artista',
        artistAvatarUrl: artistProfile?.avatarUrl || undefined,
        artistVerified: artistProfile?.verified || false,
        type: 'texto',
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      });

      onPostCreated(newPost);

      // Reset form & close modal
      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao publicar novidade: ' + (err.message || 'Tenta novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageName = artistProfile?.stageName || user?.displayName || 'O teu Perfil';
  const handle = artistProfile?.handle ? `@${artistProfile.handle}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      title="Criar Publicação"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Author header */}
        <div className="flex items-center gap-3">
          <ArtistAvatar
            name={stageName}
            imageUrl={artistProfile?.avatarUrl}
            size={42}
            verified={artistProfile?.verified}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-bone-100">{stageName}</span>
              {artistProfile?.verified && (
                <Sparkles size={13} className="shrink-0 text-cobalt-400" />
              )}
            </div>
            {handle && <p className="truncate text-xs text-bone-400">{handle}</p>}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            id="modal-feed-composer-content"
            rows={4}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
            }}
            placeholder="Partilha uma novidade com os teus fãs (ex: no estúdio, novas datas de concertos, prévias)..."
            className="w-full resize-none rounded-xl border border-ink-700 bg-ink-950 p-3.5 text-sm text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:bg-ink-900 focus:outline-none focus:ring-1 focus:ring-cobalt-500 transition-colors"
            autoFocus
          />
        </div>

        {/* Media URL Input Attachment (Collapsible) */}
        {showMediaInput && (
          <div className="rounded-xl border border-ink-700/80 bg-ink-950/70 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-bone-300">
              <span className="font-medium flex items-center gap-1.5">
                <ImageIcon size={13} className="text-cobalt-400" />
                URL da Imagem
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowMediaInput(false);
                  setMediaUrl('');
                }}
                className="text-bone-400 hover:text-bone-200"
              >
                <X size={13} />
              </button>
            </div>
            <input
              type="url"
              placeholder="https://exemplo.com/foto-concerto.jpg"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:outline-none"
            />
            {mediaUrl && (
              <div className="relative mt-2 max-h-36 overflow-hidden rounded-lg border border-ink-800 bg-ink-950">
                <img
                  src={mediaUrl}
                  alt="Pré-visualização do anexo"
                  referrerPolicy="no-referrer"
                  className="h-36 w-full object-cover"
                  onError={() => setError('Não foi possível carregar a imagem deste link.')}
                />
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                showMediaInput || mediaUrl
                  ? 'bg-cobalt-500/20 text-cobalt-400 border border-cobalt-500/30'
                  : 'text-bone-400 hover:bg-ink-800 hover:text-bone-200'
              }`}
              title="Adicionar imagem"
            >
              <ImageIcon size={15} />
              <span className="hidden sm:inline">Adicionar imagem</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Character counter */}
            <span
              className={`text-xs font-mono-data ${
                isTooLong
                  ? 'font-bold text-red-400'
                  : charsLeft < 50
                  ? 'text-amber-400'
                  : 'text-bone-400'
              }`}
            >
              {charsLeft}
            </span>

            <Button
              id="modal-feed-publish-btn"
              type="submit"
              size="sm"
              variant="primary"
              disabled={isPostEmpty || isTooLong || isSubmitting}
              className="gap-1.5 px-4 font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <span>A publicar...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Publicar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
