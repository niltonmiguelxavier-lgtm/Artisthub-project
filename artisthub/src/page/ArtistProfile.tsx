import React from 'react';
import { useParams } from 'react-router-dom';
import { Instagram, Youtube, Music, MapPin, Heart, ShoppingBag, Calendar } from 'lucide-react';
import ArtistAvatar from '../components/ArtistAvatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { featuredArtists } from '../data/artists';
import { tracks } from '../data/music';
import { opportunities } from '../data/opportunities';

export default function ArtistProfile() {
  const { handle } = useParams();
  const artist = featuredArtists.find((a) => a.handle === handle) ?? featuredArtists[0];
  const upcoming = opportunities.filter((o) => o.category === 'show').slice(0, 2);

  return (
    <div>
      {/* Cover */}
      <div className="h-40 w-full bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 sm:h-56" />

      <div className="mx-auto max-w-5xl px-5">
        <div className="-mt-14 flex flex-col items-center text-center sm:-mt-16">
          <div className="rounded-full border-4 border-ink-950">
            <ArtistAvatar name={artist.stageName} size={112} verified={artist.verified} />
          </div>
          <h1 className="mt-4 font-display text-3xl text-bone-100">{artist.stageName}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-bone-400">
            <MapPin size={14} /> {artist.location}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {artist.genres.map((g) => (
              <Badge key={g} tone="neutral">{g}</Badge>
            ))}
          </div>
          <p className="mt-5 max-w-xl text-sm text-bone-300">{artist.bio}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button icon={<Heart size={16} />}>Apoiar artista</Button>
            <Button variant="secondary" icon={<ShoppingBag size={16} />}>Ver loja</Button>
          </div>

          <div className="mt-5 flex gap-4 text-bone-400">
            {artist.socials.instagram && <Instagram size={19} />}
            {artist.socials.youtube && <Youtube size={19} />}
            {artist.socials.spotify && <Music size={19} />}
          </div>
        </div>

        {/* Music */}
        <section className="mt-14">
          <h2 className="mb-4 font-display text-xl text-bone-100">Música</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {tracks.filter((t) => t.status === 'lancada').map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-800 text-brass-400">
                  <Music size={18} />
                </div>
                <span className="text-sm text-bone-100">{t.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming events */}
        <section className="mt-10 pb-16">
          <h2 className="mb-4 font-display text-xl text-bone-100">Próximos eventos</h2>
          {upcoming.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((e) => (
                <div key={e.id} className="rounded-xl border border-ink-800 bg-ink-900 p-4">
                  <p className="text-sm font-medium text-bone-100">{e.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-bone-400">
                    <Calendar size={13} /> {e.location}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sem eventos agendados" description="Este artista ainda não anunciou próximos eventos." />
          )}
        </section>
      </div>
    </div>
  );
}
