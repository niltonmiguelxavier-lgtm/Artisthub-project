import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Radio,
  Sparkles,
  Music,
  Youtube,
  ShoppingBag,
  Compass,
  MessageSquare,
  Search,
  X,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
  Plus,
  PenSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreatePostModal from '../components/feed/CreatePostModal';
import FeedPostCard from '../components/feed/FeedPostCard';
import AuthPromptModal from '../components/AuthPromptModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import PageLoadingError from '../components/ui/PageLoadingError';
import { fetchFeedPosts, deleteFeedPost } from '../services/feedService';
import type { FeedPost, FeedPostType } from '../types';
import { DocumentSnapshot } from 'firebase/firestore';

const filterCategories: { id: FeedPostType | 'todas'; label: string; icon: any }[] = [
  { id: 'todas', label: 'Todas as Novidades', icon: Radio },
  { id: 'musica', label: 'Músicas', icon: Music },
  { id: 'video', label: 'Vídeos', icon: Youtube },
  { id: 'texto', label: 'Novidades', icon: MessageSquare },
  { id: 'produto', label: 'Loja & Beats', icon: ShoppingBag },
  { id: 'oportunidade', label: 'Oportunidades', icon: Compass },
];

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activeFilter, setActiveFilter] = useState<FeedPostType | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sentinel ref for infinite scrolling
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  const loadInitialPosts = async () => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    try {
      setStatus('loading');
      setError(null);

      timer = setTimeout(() => {
        if (!cancelled && status === 'loading') {
          setError('Isto está a demorar mais do que o esperado. Tenta novamente.');
          setStatus('error');
        }
      }, 15000);

      const res = await fetchFeedPosts(12, null, activeFilter === 'todas' ? undefined : activeFilter);
      if (!cancelled) {
        setPosts(res.posts);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
        setStatus('success');
      }
    } catch (err: any) {
      if (!cancelled) {
        console.error('Failed to load feed:', err);
        setError('Não foi possível carregar as publicações do feed. Tenta novamente.');
        setStatus('error');
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    loadInitialPosts();
  }, [activeFilter]);

  const handleLoadMore = useCallback(async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const res = await fetchFeedPosts(10, lastDoc, activeFilter === 'todas' ? undefined : activeFilter);
      setPosts((prev) => [...prev, ...res.posts]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load more feed posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, hasMore, activeFilter]);

  // Infinite scroll observer setup
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && status === 'success') {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '300px', // trigger 300px before user hits bottom
        threshold: 0.1,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, hasMore, loadingMore, status]);

  const handlePostCreated = (newPost: FeedPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId: string) => {
    await deleteFeedPost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Client-side search filtering
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Filter by type if not handled by server
      if (activeFilter !== 'todas' && post.type !== activeFilter) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = post.content?.toLowerCase().includes(q);
        const matchesArtist =
          post.artistName?.toLowerCase().includes(q) || post.artistHandle?.toLowerCase().includes(q);
        const matchesTitle = post.metadata?.trackTitle?.toLowerCase().includes(q);
        return matchesContent || matchesArtist || matchesTitle;
      }
      return true;
    });
  }, [posts, activeFilter, searchQuery]);

  return (
    <div className="relative min-w-0 max-w-full space-y-6">
      {/* 
        ══════════════════════════════════════════════════════════════════
        1. ZONA FIXA (STICKY HEADER COM PESQUISA, FILTROS E COMPOSER)
        Permanently visible at top during scroll, docked below app header
        ══════════════════════════════════════════════════════════════════
      */}
      <div className="sticky top-[57px] sm:top-[65px] z-30 -mt-6 sm:-mt-8 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 py-3 sm:py-3.5 bg-ink-950/98 backdrop-blur-md border-b border-ink-800 shadow-lg transition-all space-y-2.5">
        <div className="mx-auto max-w-6xl space-y-2.5">
          {/* Top Bar: Title, Action Button & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
            <div className="flex items-center justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cobalt-500/15 text-cobalt-400 border border-cobalt-500/20">
                  <Radio size={17} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-lg sm:text-2xl font-bold text-bone-100 leading-tight truncate">
                      Feed Público
                    </h1>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-400/20 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ao Vivo
                    </span>
                  </div>
                  <p className="hidden md:block text-xs text-bone-400 truncate max-w-md">
                    Lançamentos, vídeos, batidas e carreira da comunidade ArtistHub
                  </p>
                </div>
              </div>

              {/* Botão de Ação na Zona Fixa do Topo */}
              <div className="flex items-center gap-2 shrink-0">
                {user ? (
                  <Button
                    id="feed-create-post-btn"
                    size="sm"
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold shadow-sm shrink-0"
                    title="Criar nova publicação"
                  >
                    <Plus size={15} className="shrink-0" />
                    <span className="hidden xs:inline">Publicar</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium shrink-0 text-cobalt-300 border-cobalt-500/30 hover:bg-cobalt-500/10"
                    title="Criar conta para partilhar"
                  >
                    <PenSquare size={13} className="shrink-0" />
                    <span className="hidden sm:inline">Partilhar</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-400 pointer-events-none"
              />
              <input
                id="feed-search"
                type="text"
                placeholder="Pesquisar artistas ou posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-ink-700/80 bg-ink-900 py-2 pl-9 pr-8 text-xs text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:bg-ink-850 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-bone-400 hover:bg-ink-800 hover:text-bone-200"
                  title="Limpar pesquisa"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Categories Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            {filterCategories.map(({ id, label, icon: Icon }) => {
              const isActive = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFilter(id)}
                  className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cobalt-500 text-bone-100 shadow-sm font-semibold'
                      : 'border border-ink-800 bg-ink-900/90 text-bone-300 hover:border-ink-700 hover:bg-ink-850 hover:text-bone-100'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-bone-100' : 'text-cobalt-400'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════════
        2. ZONA DE SCROLL (CONTEÚDO E PUBLICAÇÕES)
        ══════════════════════════════════════════════════════════════════
      */}
      <div className="space-y-6">
        {/* Feed Stream */}
        <section aria-label="Lista de publicações" className="space-y-4">
          {status === 'loading' && posts.length === 0 ? (
            // Loading skeleton state
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-ink-800 bg-ink-900 p-5 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-ink-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-32 rounded bg-ink-800" />
                      <div className="h-2.5 w-20 rounded bg-ink-800" />
                    </div>
                  </div>
                  <div className="h-16 rounded-xl bg-ink-950" />
                  <div className="h-3 w-48 rounded bg-ink-800" />
                </div>
              ))}
            </div>
          ) : status === 'error' && posts.length === 0 ? (
            <PageLoadingError error={error} onRetry={loadInitialPosts} />
          ) : filteredPosts.length > 0 ? (
            <>
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    onDelete={handleDeletePost}
                    onAuthRequired={() => setIsAuthModalOpen(true)}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel & Loading indicator */}
              <div ref={observerTargetRef} className="py-4 text-center">
                {loadingMore ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-ink-800 bg-ink-900/80 px-4 py-2 text-xs text-bone-300">
                    <RefreshCw size={14} className="animate-spin text-cobalt-400" />
                    <span>A carregar mais publicações...</span>
                  </div>
                ) : hasMore ? (
                  <Button
                    variant="secondary"
                    onClick={handleLoadMore}
                    className="gap-2 text-xs"
                  >
                    <RefreshCw size={14} />
                    Carregar mais publicações
                  </Button>
                ) : (
                  <p className="text-xs text-bone-500 pt-2">
                    Chegaste ao fim das publicações nesta categoria.
                  </p>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Radio}
              title="Nenhuma publicação encontrada"
              description={
                searchQuery
                  ? 'Nenhum resultado para a tua pesquisa. Experimenta outros termos.'
                  : 'Ainda não existem publicações nesta categoria. Sê o primeiro a partilhar!'
              }
            />
          )}
        </section>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Inicia sessão para reagir"
        description="Cria uma conta gratuita no ArtistHub para apoiares os artistas da comunidade com gostos e partilhares as tuas músicas."
      />
    </div>
  );
}

