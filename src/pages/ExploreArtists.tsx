import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, collection, getDocs } from '../lib/firebase';
import ArtistAvatar from '../components/ArtistAvatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageLoadingError from '../components/ui/PageLoadingError';
import { Users, MapPin, Search, Music2, ExternalLink, Sparkles, Radio } from 'lucide-react';
import { featuredArtists as fallbackArtists } from '../data/artists';
import type { Artist } from '../types';

export default function ExploreArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadArtists = async () => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    try {
      setStatus('loading');
      setError(null);

      // Safety timeout
      timer = setTimeout(() => {
        if (!cancelled && status === 'loading') {
          setError('Isto está a demorar mais do que o esperado. Tenta novamente.');
          setStatus('error');
        }
      }, 15000);

      const snap = await getDocs(collection(db, 'artists'));
      if (!snap.empty) {
        const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Artist));
        const combined = [...loaded];
        fallbackArtists.forEach((fa) => {
          if (!combined.some((a) => a.handle === fa.handle)) {
            combined.push(fa);
          }
        });
        if (!cancelled) {
          setArtists(combined);
          setStatus('success');
        }
      } else {
        if (!cancelled) {
          setArtists(fallbackArtists);
          setStatus('success');
        }
      }
    } catch (e: any) {
      if (!cancelled) {
        console.warn('Artists fetch notice, using fallback:', e);
        setArtists(fallbackArtists);
        setStatus('success');
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const filteredArtists = artists.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.stageName.toLowerCase().includes(q) ||
      a.handle.toLowerCase().includes(q) ||
      a.genres?.some((g) => g.toLowerCase().includes(q)) ||
      a.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cobalt-500/10 text-cobalt-400">
              <Users size={16} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cobalt-400">
              Comunidade ArtistHub
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-bone-100 sm:text-3xl">
            Explorar Artistas
          </h1>
          <p className="mt-1 text-sm text-bone-400 max-w-xl">
            Descobre novos talentos, colabora com produtores e músicos e explora perfis públicos na plataforma.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, género ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2.5 pl-9 pr-4 text-xs text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Artists */}
      {status === 'loading' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-ink-800 bg-ink-900 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-ink-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 rounded bg-ink-800" />
                  <div className="h-3 w-20 rounded bg-ink-800" />
                </div>
              </div>
              <div className="h-12 rounded-xl bg-ink-950" />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <PageLoadingError error={error} onRetry={loadArtists} />
      ) : filteredArtists.length === 0 ? (
        <div className="rounded-2xl border border-ink-800 bg-ink-900 p-10 text-center text-xs text-bone-400">
          Nenhum artista encontrado com o termo pesquisado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className="flex flex-col justify-between rounded-2xl border border-ink-800 bg-ink-900 p-5 transition-all hover:border-ink-700 hover:shadow-panel"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ArtistAvatar
                      name={artist.stageName}
                      src={artist.avatarUrl}
                      size={54}
                      verified={artist.verified || artist.subscriptionTier === 'pro'}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-bone-100">
                        {artist.stageName}
                      </h3>
                      <p className="truncate text-xs text-bone-400">@{artist.handle}</p>
                      {artist.location && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-bone-400 truncate">
                          <MapPin size={11} className="text-cobalt-400 shrink-0" />
                          <span className="truncate">{artist.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {artist.bio && (
                  <p className="mt-3 text-xs leading-relaxed text-bone-300 line-clamp-2">
                    {artist.bio}
                  </p>
                )}

                {artist.genres && artist.genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {artist.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded-md bg-ink-800 px-2 py-0.5 text-[10px] text-bone-300"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-ink-800/80 pt-4">
                <span className="text-[11px] text-bone-400">
                  <strong className="text-bone-200">{artist.followers.toLocaleString()}</strong> fãs
                </span>

                <div className="flex items-center gap-2">
                  <Link to={`/artist/${artist.handle}`} target="_blank">
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs py-1.5 px-3">
                      Ver Perfil
                      <ExternalLink size={12} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
