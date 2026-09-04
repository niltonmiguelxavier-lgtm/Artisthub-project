import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  Pause,
  Music,
  Youtube,
  ShoppingBag,
  Compass,
  Sparkles,
  ExternalLink,
  Trash2,
  Check,
  Headphones,
  Calendar,
  MapPin,
  Building2,
} from 'lucide-react';
import type { FeedPost } from '../../types';
import ArtistAvatar from '../ArtistAvatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatRelativeTime, formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useAudio } from '../../context/AudioContext';
import { toggleFeedLike, checkUserLikedPost } from '../../services/feedService';
import { extractYouTubeId } from '../../utils/youtube';

export interface FeedPostCardProps {
  post: FeedPost;
  onDelete?: (postId: string) => void;
  onAuthRequired?: () => void;
  key?: React.Key;
}

export default function FeedPostCard({ post, onDelete, onAuthRequired }: FeedPostCardProps) {
  const { user, artistProfile } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCommentNotice, setShowCommentNotice] = useState(false);

  const isAuthor = user && (user.uid === post.artistId || artistProfile?.id === post.artistId);

  useEffect(() => {
    let isMounted = true;
    if (user?.uid) {
      checkUserLikedPost(post.id, user.uid).then((liked) => {
        if (isMounted) setIsLiked(liked);
      });
    } else {
      setIsLiked(false);
    }
    return () => {
      isMounted = false;
    };
  }, [post.id, user?.uid]);

  const handleLike = async () => {
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const result = await toggleFeedLike(post.id, user.uid);
      setIsLiked(result.liked);
    } catch (err) {
      // Revert on error
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleCommentsClick = () => {
    setShowCommentNotice(true);
    setTimeout(() => setShowCommentNotice(false), 3000);
  };

  // Audio track playback check
  const isThisAudioPlaying =
    isPlaying &&
    currentTrack &&
    (currentTrack.id === (post.relatedId || post.id) ||
      currentTrack.audioUrl === post.metadata?.audioUrl);

  const handleTogglePlayAudio = () => {
    if (!post.metadata?.audioUrl && !post.mediaUrl) return;

    playTrack({
      id: post.relatedId || post.id,
      title: post.metadata?.trackTitle || post.content.slice(0, 30) || 'Faixa de Áudio',
      artistName: post.artistName || 'Artista',
      audioUrl: post.metadata?.audioUrl || post.mediaUrl || '',
      coverUrl: post.mediaUrl,
    });
  };

  const typeConfig: Record<
    FeedPost['type'],
    { label: string; tone: 'neutral' | 'success' | 'warning' | 'progress' | 'cobalt'; icon: any }
  > = {
    musica: { label: 'Nova Música', tone: 'success', icon: Music },
    video: { label: 'Novo Vídeo', tone: 'warning', icon: Youtube },
    texto: { label: 'Novidade', tone: 'progress', icon: Sparkles },
    produto: { label: 'Loja & Beats', tone: 'cobalt', icon: ShoppingBag },
    oportunidade: { label: 'Oportunidade', tone: 'warning', icon: Compass },
  };

  const currentTypeConfig = typeConfig[post.type] || typeConfig.texto;
  const TypeIcon = currentTypeConfig.icon;

  // Extract youtube video ID if video
  const youtubeVideoId =
    post.metadata?.youtubeId ||
    (post.metadata?.youtubeUrl ? extractYouTubeId(post.metadata.youtubeUrl) : '') ||
    (post.mediaUrl ? extractYouTubeId(post.mediaUrl) : '');

  return (
    <article
      id={`post-${post.id}`}
      className="group rounded-2xl border border-ink-800 bg-ink-900/90 p-5 transition-all hover:border-ink-700/90 hover:shadow-lg sm:p-6"
    >
      {/* Header: Artist & Metadata */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/artist/${post.artistHandle || 'artista'}`}
            className="transition-transform hover:scale-105"
          >
            <ArtistAvatar
              name={post.artistName || 'Artista'}
              size={46}
              verified={post.artistVerified}
              imageUrl={post.artistAvatarUrl}
            />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/artist/${post.artistHandle || 'artista'}`}
                className="font-display font-medium text-bone-100 hover:text-cobalt-400 transition-colors"
              >
                {post.artistName || 'Artista'}
              </Link>
              {post.artistVerified && (
                <span className="rounded-full bg-teal-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400">
                  Verificado
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-bone-400">
              <span>@{post.artistHandle || 'artista'}</span>
              <span>•</span>
              <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={currentTypeConfig.tone}>
            <TypeIcon size={12} />
            <span>{currentTypeConfig.label}</span>
          </Badge>

          {isAuthor && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-lg p-1.5 text-bone-400 hover:bg-ink-800 hover:text-rose-400 transition-colors"
              title="Eliminar publicação"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      {post.content && (
        <div className="mt-4 text-sm leading-relaxed text-bone-200 whitespace-pre-line sm:text-[15px]">
          {post.content}
        </div>
      )}

      {/* RICH MEDIA: TYPE SPECIFIC PRESENTATION */}

      {/* 1. MUSIC PLAYER EMBED */}
      {post.type === 'musica' && (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink-700/80 bg-gradient-to-r from-ink-950 to-ink-900 p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {post.mediaUrl ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink-800 shadow-md">
                <img
                  src={post.mediaUrl}
                  alt={post.metadata?.trackTitle || 'Capa da música'}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleTogglePlayAudio}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity hover:bg-black/60"
                  aria-label="Tocar música"
                >
                  {isThisAudioPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTogglePlayAudio}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-cobalt-500 text-ink-950 shadow-md transition-transform hover:scale-105"
                aria-label="Tocar música"
              >
                {isThisAudioPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-0.5" />
                )}
              </button>
            )}

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <p className="font-display font-medium text-bone-100 truncate text-base">
                  {post.metadata?.trackTitle || 'Faixa de Lançamento'}
                </p>
                {isThisAudioPlaying && (
                  <span className="flex items-center gap-1 text-[11px] font-mono-data text-teal-400">
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                    A reproduzir
                  </span>
                )}
              </div>
              <p className="text-xs text-bone-400 mt-0.5">
                {post.artistName} {post.metadata?.audioFormat ? `• ${post.metadata.audioFormat.toUpperCase()}` : ''}
              </p>

              <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                <Button
                  size="sm"
                  variant={isThisAudioPlaying ? 'secondary' : 'primary'}
                  onClick={handleTogglePlayAudio}
                  className="gap-2 text-xs"
                >
                  {isThisAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isThisAudioPlaying ? 'Pausar' : 'Ouvir Música'}
                </Button>

                <Link
                  to={`/artist/${post.artistHandle || 'artista'}`}
                  className="text-xs text-bone-400 hover:text-bone-200 transition-colors flex items-center gap-1"
                >
                  <Headphones size={13} />
                  Ver discografia
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIDEO EMBED */}
      {post.type === 'video' && youtubeVideoId && (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink-800 bg-black shadow-md">
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
              title={post.content || 'Vídeo do YouTube'}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 3. PRODUCT / STORE EMBED */}
      {post.type === 'produto' && (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-amber-500/20 bg-ink-950/80 p-4">
          {post.mediaUrl && (
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
              <img
                src={post.mediaUrl}
                alt="Produto"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Badge tone="cobalt">
                {post.metadata?.productCategory?.toUpperCase() || 'PRODUTO DIGITAL'}
              </Badge>
              {post.metadata?.productPrice ? (
                <span className="font-mono-data text-sm font-semibold text-teal-400">
                  {formatCurrency(post.metadata.productPrice)}
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-bone-400">
              Disponível para download imediato na Loja Oficial ArtistHub.
            </p>

            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
              <Link to="/store">
                <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                  <ShoppingBag size={13} />
                  Ver na Loja & Comprar
                </Button>
              </Link>

              {post.metadata?.audioUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    playTrack({
                      id: post.relatedId || post.id,
                      title: 'Preview de Beat',
                      artistName: post.artistName || 'Artista',
                      audioUrl: post.metadata?.audioUrl || '',
                      isPreview: true,
                    })
                  }
                  className="gap-1 text-xs text-bone-300"
                >
                  <Play size={13} />
                  Ouvir Demo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. OPPORTUNITY EMBED */}
      {post.type === 'oportunidade' && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge tone="success">
                  {post.metadata?.opportunityCategory?.toUpperCase() || 'OPORTUNIDADE'}
                </Badge>
                {post.metadata?.opportunityOrg && (
                  <span className="text-xs font-semibold text-bone-200 flex items-center gap-1">
                    <Building2 size={13} className="text-emerald-400" />
                    {post.metadata.opportunityOrg}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-bone-400">
                {post.metadata?.opportunityLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-bone-400" />
                    {post.metadata.opportunityLocation}
                  </span>
                )}
                {post.metadata?.opportunityDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-bone-400" />
                    {post.metadata.opportunityDate}
                  </span>
                )}
              </div>
            </div>

            <Link to="/opportunities" className="w-full sm:w-auto">
              <Button size="sm" variant="primary" className="w-full gap-1.5 text-xs">
                <Compass size={13} />
                Candidatar-me
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 5. GENERIC MEDIA IMAGE (IF TEXT / GENERAL POST HAS ATTACHED IMAGE) */}
      {post.type === 'texto' && post.mediaUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink-800">
          <img
            src={post.mediaUrl}
            alt="Imagem da publicação"
            className="max-h-96 w-full object-cover"
          />
        </div>
      )}

      {/* Footer: Interactions & Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-ink-800/80 pt-3.5 text-xs text-bone-400">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors group/btn ${
              isLiked
                ? 'text-rose-400 font-semibold'
                : 'hover:text-rose-400 text-bone-400'
            }`}
            aria-label={isLiked ? 'Remover gosto' : 'Gosto'}
          >
            <Heart
              size={17}
              className={`transition-transform duration-200 ${
                isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'group-hover/btn:scale-110'
              }`}
            />
            <span>{likesCount}</span>
          </button>

          {/* Comments Button (Visual prepared) */}
          <div className="relative">
            <button
              type="button"
              onClick={handleCommentsClick}
              className="flex items-center gap-1.5 text-bone-400 hover:text-cobalt-400 transition-colors"
              aria-label="Comentários"
            >
              <MessageCircle size={17} />
              <span>{post.commentsCount || 0}</span>
            </button>

            {showCommentNotice && (
              <div className="absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-lg bg-ink-800 px-2.5 py-1 text-[11px] text-bone-200 shadow-xl border border-ink-700 animate-fade-in z-20">
                💬 Comentários em breve no ArtistHub!
              </div>
            )}
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-bone-400 hover:text-teal-400 transition-colors"
            title="Copiar link"
          >
            {copied ? <Check size={16} className="text-teal-400" /> : <Share2 size={16} />}
            <span>{copied ? 'Copiado!' : 'Partilhar'}</span>
          </button>
        </div>

        {/* View artist profile shortcut */}
        <Link
          to={`/artist/${post.artistHandle || 'artista'}`}
          className="flex items-center gap-1 text-[11px] text-bone-400 hover:text-bone-200 transition-colors"
        >
          Perfil do artista
          <ExternalLink size={11} />
        </Link>
      </div>
    </article>
  );
}
