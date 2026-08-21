import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { db, collection, getDocs, query, where } from '../lib/firebase';
import ArtistAvatar from '../components/ArtistAvatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  MapPin,
  Users,
  Instagram,
  Youtube,
  Share2,
  Music2,
  Disc3,
  Play,
  Pause,
  ExternalLink,
  ShoppingBag,
  Heart,
  Sparkles,
} from 'lucide-react';
import { currentArtist as fallbackArtist } from '../data/artists';
import { initialTracks as fallbackTracks } from '../data/music';
import type { Artist, Track, YouTubeVideo, Product } from '../types';
import { getYouTubeEmbedUrl } from '../utils/youtube';
import { formatCurrency } from '../utils/format';

export default function ArtistProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { artistProfile: currentAuthArtist } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);

        let targetArtist: Artist | null = null;

        // Check if viewing authenticated user's own profile
        if (currentAuthArtist && (currentAuthArtist.handle === handle || !handle)) {
          targetArtist = currentAuthArtist;
        } else {
          // Query Firestore by handle
          const q = query(collection(db, 'artists'), where('handle', '==', handle));
          const snap = await getDocs(q);
          if (!snap.empty) {
            targetArtist = { id: snap.docs[0].id, ...snap.docs[0].data() } as Artist;
          }
        }

        if (!targetArtist) {
          targetArtist = fallbackArtist;
        }
        setArtist(targetArtist);

        // Fetch released tracks for this artist
        const tSnap = await getDocs(
          query(
            collection(db, 'tracks'),
            where('artistId', '==', targetArtist.id),
            where('status', '==', 'lancada')
          )
        );

        if (!tSnap.empty) {
          setTracks(tSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Track)));
        } else {
          setTracks(fallbackTracks.filter((t) => t.status === 'lancada'));
        }

        // Fetch videos
        const vSnap = await getDocs(
          query(collection(db, 'videos'), where('artistId', '==', targetArtist.id))
        );
        if (!vSnap.empty) {
          setVideos(vSnap.docs.map((d) => ({ id: d.id, ...d.data() } as YouTubeVideo)));
        } else {
          setVideos([
            {
              id: 'v-1',
              artistId: targetArtist.id,
              title: `${targetArtist.stageName} - Atuação ao Vivo & Videoclipe Oficial`,
              youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              youtubeId: 'dQw4w9WgXcQ',
              thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
              addedAt: new Date().toISOString(),
            },
          ]);
        }

        // Fetch store products for this artist
        const pSnap = await getDocs(
          query(collection(db, 'products'), where('artistId', '==', targetArtist.id))
        );
        if (!pSnap.empty) {
          setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
        }
      } catch (e) {
        console.warn('Error fetching artist public profile data:', e);
        setArtist(fallbackArtist);
        setTracks(fallbackTracks.filter((t) => t.status === 'lancada'));
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [handle, currentAuthArtist]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!artist) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-bone-400">
        A carregar perfil de artista...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Hero / Cover */}
      <div className="relative overflow-hidden rounded-3xl border border-ink-800 bg-gradient-to-b from-ink-850 to-ink-900">
        <div className="h-44 w-full bg-ink-950 sm:h-56">
          {artist.coverUrl ? (
            <img src={artist.coverUrl} alt="Capa" className="h-full w-full object-cover opacity-60" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-cobalt-600/30 via-ink-900 to-teal-600/20" />
          )}
        </div>

        <div className="relative px-6 pb-6 pt-0 sm:px-8">
          <div className="-mt-16 mb-4 flex flex-col justify-between gap-4 sm:-mt-20 sm:flex-row sm:items-end">
            <div className="flex items-end gap-4">
              <ArtistAvatar
                name={artist.stageName}
                src={artist.avatarUrl}
                size={96}
                verified={artist.verified || artist.subscriptionTier === 'pro'}
              />
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-bone-100 sm:text-3xl">
                    {artist.stageName}
                  </h1>
                </div>
                <p className="text-xs text-bone-400">@{artist.handle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                <Share2 size={14} />
                {copied ? 'Link Copiado!' : 'Partilhar Perfil'}
              </Button>
              <Link to="/store">
                <Button variant="primary" size="sm" className="gap-1.5 font-medium">
                  <ShoppingBag size={14} />
                  Loja Oficial
                </Button>
              </Link>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-bone-300">{artist.bio}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-bone-400">
            {artist.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-cobalt-400" />
                {artist.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={14} className="text-cobalt-400" />
              {artist.followers.toLocaleString()} seguidores
            </span>
          </div>

          {/* Genres & Socials */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {artist.genres?.map((g) => (
                <span key={g} className="rounded-full bg-ink-800 px-3 py-1 text-xs text-bone-300">
                  {g}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {artist.socials?.instagram && (
                <a
                  href={artist.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-bone-400 transition-colors hover:bg-ink-800 hover:text-bone-100"
                >
                  <Instagram size={17} />
                </a>
              )}
              {artist.socials?.youtube && (
                <a
                  href={artist.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-bone-400 transition-colors hover:bg-ink-800 hover:text-bone-100"
                >
                  <Youtube size={17} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Music Section (Real Released Tracks) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 size={20} className="text-cobalt-400" />
            <h2 className="font-display text-xl text-bone-100">Músicas & Lançamentos</h2>
          </div>
          <span className="text-xs text-bone-400">{tracks.length} faixas disponíveis</span>
        </div>

        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-ink-800 bg-ink-900 p-8 text-center text-xs text-bone-400">
            Nenhuma música lançada publicamente ainda.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tracks.map((t) => {
              const isPlayingThis = currentTrack?.id === t.id && isPlaying;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl border border-ink-800 bg-ink-900 p-3.5 transition-colors hover:border-ink-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        playTrack({
                          id: t.id,
                          title: t.title,
                          artistName: artist.stageName,
                          audioUrl: t.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                          coverUrl: t.coverUrl,
                        })
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-cobalt-400 transition-transform active:scale-95 hover:bg-cobalt-500 hover:text-ink-950"
                    >
                      {isPlayingThis ? <Disc3 size={20} className="animate-spin" /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-bone-100">{t.title}</p>
                      <p className="truncate text-xs text-bone-400">
                        {t.type.toUpperCase()} • {t.releaseDate}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      playTrack({
                        id: t.id,
                        title: t.title,
                        artistName: artist.stageName,
                        audioUrl: t.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                        coverUrl: t.coverUrl,
                      })
                    }
                    className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs text-bone-300 hover:bg-cobalt-500 hover:text-ink-950"
                  >
                    {isPlayingThis ? 'Ouvindo' : 'Ouvir'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Embedded YouTube Videos Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Youtube size={20} className="text-rose-400" />
          <h2 className="font-display text-xl text-bone-100">Vídeos & Videoclipes</h2>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-2xl border border-ink-800 bg-ink-900 p-8 text-center text-xs text-bone-400">
            Nenhum vídeo disponível no momento.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {videos.map((vid) => (
              <div key={vid.id} className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
                <div className="relative aspect-video w-full bg-ink-950">
                  <iframe
                    src={getYouTubeEmbedUrl(vid.youtubeId)}
                    title={vid.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-display text-sm text-bone-100">{vid.title}</h3>
                  <a
                    href={vid.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-cobalt-400 hover:underline"
                  >
                    Ver no YouTube
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Support / Store Preview */}
      <section className="rounded-3xl border border-cobalt-500/30 bg-gradient-to-br from-cobalt-500/10 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-xl text-bone-100">Apoia o trabalho de {artist.stageName}</h3>
          <p className="mt-1 max-w-lg text-xs text-bone-300">
            Adquire instrumentais exclusivos, produções e merchandise oficial diretamente do artista com entrega imediata.
          </p>
        </div>
        <Link to="/store">
          <Button variant="primary" className="gap-2 px-6 py-3 font-medium">
            <ShoppingBag size={16} />
            Explorar Loja de {artist.stageName}
          </Button>
        </Link>
      </section>
    </div>
  );
}
