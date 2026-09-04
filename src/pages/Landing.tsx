import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Heart,
  Search,
  ChevronRight,
  SkipBack,
  SkipForward,
  Volume2,
  Verified,
  Share2,
  User,
  Instagram,
  Youtube,
  Facebook,
  Mic2,
  Disc3,
  Music2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tokens de cor — um único acento, resto neutro
// ---------------------------------------------------------------------------

const ACCENT = '#E8871E';
const INK = '#18171F';
const MUTED = '#6B6875';
const BG = '#FAF9F6';
const CARD = '#FFFFFF';
const BORDER = '#E8E4DC';
const TILE = '#18171F';
const SHADOW = '0 4px 20px rgba(24,23,34,0.06)';

const NAV_LINKS = [
  { label: 'Início', path: '/' },
  { label: 'Explorar', path: '/listen' },
  { label: 'Artistas', path: '/artists' },
  { label: 'Lançamentos', path: '/listen' },
  { label: 'Vídeos', path: '/feed' },
];

const RELEASES = [
  { id: 1, title: 'Prometo Te Amar', artist: 'Nilton Xavier & Jay Ilson Da Luzia', genre: 'R&B', date: '12 Ago' },
  { id: 2, title: 'Tudo Vem Tudo Vai', artist: 'Nilton Xavier', genre: 'Afro Pop', date: '9 Ago' },
  { id: 3, title: 'Nunca Fui Eu', artist: 'Lira Machel', genre: 'Soul', date: '6 Ago' },
  { id: 4, title: 'Litoral Sul', artist: 'DJ Nhampossa', genre: 'Amapiano', date: '3 Ago' },
];

const TRENDING = [
  { id: 1, title: 'Chuva de Verão', artist: 'Nayara Mbeve' },
  { id: 2, title: 'Prometo Te Amar', artist: 'Nilton Xavier & Jay Ilson Da Luzia' },
  { id: 3, title: 'Cidade de Pedra', artist: 'Zeca Nhampossa' },
  { id: 4, title: 'Timbila', artist: 'Wazimbo Jr.' },
];

const FEATURED_ARTISTS = [
  { id: 1, name: 'Nayara Mbeve', genre: 'Marrabenta Soul', verified: true, handle: 'nayara-mbeve' },
  { id: 2, name: 'Nilton Xavier', genre: 'R&B Lusófono', verified: true, handle: 'nilton-xavier' },
  { id: 3, name: 'Zeca Nhampossa', genre: 'Afrobeat', verified: true, handle: 'zeca-nhampossa' },
];

const NEW_TALENT = [
  { id: 1, name: 'Lira Machel', genre: 'Soul' },
  { id: 2, name: 'Ketu Beats', genre: 'Amapiano' },
  { id: 3, name: 'Ivânia Cossa', genre: 'R&B' },
  { id: 4, name: 'MC Sável', genre: 'Hip-Hop' },
  { id: 5, name: 'Dj Culuza', genre: 'Afro House' },
];

const GENRES = ['Kizomba', 'Afrobeat', 'Hip-Hop', 'Amapiano', 'R&B', 'Marrabenta', 'Gospel', 'Dancehall'];

const SUPPORT_ARTISTS = [
  { id: 1, name: 'Nayara Mbeve' },
  { id: 2, name: 'Zeca Nhampossa' },
  { id: 3, name: 'Lira Machel' },
  { id: 4, name: 'Nilton Xavier' },
];

// ---------------------------------------------------------------------------
// Elementos visuais reutilizáveis
// ---------------------------------------------------------------------------

function CoverArt({ icon: Icon = Music2, rounded = 'rounded-xl', className = '' }: { icon?: React.ElementType; rounded?: string; className?: string }) {
  return (
    <div className={`relative ${rounded} overflow-hidden flex items-center justify-center shrink-0 ${className}`} style={{ background: TILE }}>
      <Icon className="w-1/3 h-1/3 text-white/25 relative" strokeWidth={1.5} />
    </div>
  );
}

function PortraitArt({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden flex items-end justify-center ${className}`} style={{ background: TILE }}>
      <User className="w-1/2 h-1/2 text-white/20 relative mb-[-8%]" strokeWidth={1} />
    </div>
  );
}

function SectionHeader({ title, subtitle, action, actionTo = '/listen' }: { title: string; subtitle?: string; action?: string; actionTo?: string }) {
  return (
    <div className="flex items-end justify-between mb-7 gap-4">
      <div>
        <p className="font-display text-xl sm:text-2xl" style={{ color: INK }}>{title}</p>
        {subtitle && <p className="text-sm mt-1" style={{ color: MUTED }}>{subtitle}</p>}
      </div>
      {action && (
        <Link to={actionTo} className="hidden sm:inline-flex items-center gap-1 text-sm font-medium shrink-0" style={{ color: INK }}>
          {action} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b" style={{ background: `${BG}F5`, borderColor: BORDER }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: INK }}>
            <Disc3 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg" style={{ color: INK }}>ArtistHub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={l.path} className="text-sm font-medium transition-colors hover:text-[#18171F]" style={{ color: MUTED }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link to="/listen" className="p-2 rounded-full hover:bg-black/[0.04] transition-colors" style={{ color: MUTED }} aria-label="Pesquisar">
            <Search className="w-4 h-4" />
          </Link>
          <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-medium rounded-full border transition-colors hover:bg-black/5" style={{ color: INK, borderColor: BORDER }}>
            Entrar
          </Link>
          <Link to="/register" className="px-4 py-2 text-sm rounded-full font-medium text-white transition-opacity hover:opacity-90" style={{ background: INK }}>
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  const tiles = [
    { size: 'w-32 h-32', pos: 'top-0 left-8', rot: '-rotate-6' },
    { size: 'w-40 h-40', pos: 'top-10 left-32', rot: 'rotate-3' },
    { size: 'w-28 h-28', pos: 'top-44 left-4', rot: 'rotate-6' },
    { size: 'w-36 h-36', pos: 'top-52 left-40', rot: '-rotate-3' },
  ];
  return (
    <section className="max-w-6xl mx-auto px-5 pt-4">
      <div className="relative overflow-hidden rounded-[2rem] px-6 sm:px-12 py-14 sm:py-20" style={{ background: INK }}>
        <div className="relative grid md:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono font-medium uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: ACCENT, color: INK }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: INK }} />
              Em destaque no ArtistHub
            </span>
            <h1 className="font-display text-[2.75rem] sm:text-6xl leading-[1.02] mt-5 mb-5 text-white">
              Descobre. Ouve.
              <br />
              Apoia.
            </h1>
            <p className="text-base sm:text-lg max-w-md mb-8 leading-relaxed text-white/60">
              Descobre novos artistas, acompanha os lançamentos mais recentes e
              apoia directamente quem cria a música que gostas.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/listen" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-transform hover:scale-[1.02]" style={{ background: ACCENT, color: INK }}>
                <Play className="w-4 h-4" fill="currentColor" /> Explorar música
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium border border-white/15 text-white hover:bg-white/10 transition-colors">
                <Mic2 className="w-4 h-4" /> Sou artista
              </Link>
            </div>
          </div>

          <div className="relative h-80 hidden sm:block">
            {tiles.map((t, i) => (
              <div key={i} className={`absolute ${t.size} ${t.pos} ${t.rot} rounded-2xl shadow-2xl overflow-hidden border border-white/10`}>
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#232230' }}>
                  <Music2 className="w-1/3 h-1/3 text-white/20" strokeWidth={1.5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Lançamentos recentes
// ---------------------------------------------------------------------------

function RecentReleases({ onPlay, playingId }: { onPlay: (id: string) => void; playingId: string | null }) {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <SectionHeader title="Lançamentos recentes" subtitle="As músicas que acabaram de chegar ao ArtistHub." action="Ver todos" actionTo="/listen" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {RELEASES.map((r) => {
          const isPlaying = playingId === `r${r.id}`;
          return (
            <div key={r.id} className="group rounded-2xl p-3 border transition-shadow hover:shadow-lg" style={{ borderColor: BORDER, background: CARD, boxShadow: SHADOW }}>
              <div className="relative">
                <CoverArt rounded="rounded-xl" className="w-full aspect-square" />
                <button
                  onClick={() => onPlay(`r${r.id}`)}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                  style={{ background: isPlaying ? ACCENT : 'white', color: INK }}
                  aria-label={isPlaying ? 'Pausar' : 'Tocar'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
                </button>
              </div>
              <p className="text-sm font-semibold mt-3 leading-snug truncate" style={{ color: INK }}>{r.title}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>{r.artist}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono font-semibold uppercase" style={{ color: MUTED }}>{r.genre}</span>
                <span className="text-[10px] font-mono" style={{ color: MUTED }}>{r.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Em alta
// ---------------------------------------------------------------------------

function TrendingRanking({ onPlay, playingId }: { onPlay: (id: string) => void; playingId: string | null }) {
  return (
    <section className="max-w-6xl mx-auto px-5 py-4">
      <SectionHeader title="Em alta" subtitle="O que Moçambique está a ouvir esta semana." />
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: CARD, boxShadow: SHADOW }}>
        {TRENDING.map((t, i) => {
          const isPlaying = playingId === `t${t.id}`;
          return (
            <div
              key={t.id}
              className="flex items-center gap-4 px-4 sm:px-5 py-3.5"
              style={{ borderBottom: i !== TRENDING.length - 1 ? `1px solid ${BORDER}` : 'none' }}
            >
              <span className="font-display text-lg w-7 shrink-0" style={{ color: isPlaying ? ACCENT : MUTED }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <CoverArt rounded="rounded-lg" className="w-11 h-11" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: INK }}>{t.title}</p>
                <p className="text-xs truncate" style={{ color: MUTED }}>{t.artist}</p>
              </div>
              {isPlaying && (
                <div className="hidden sm:flex items-end gap-[3px] h-4" aria-hidden="true">
                  {[6, 12, 8, 10].map((h, idx) => (
                    <span key={idx} className="w-[3px] rounded-full animate-pulse" style={{ height: h, background: ACCENT }} />
                  ))}
                </div>
              )}
              <button
                onClick={() => onPlay(`t${t.id}`)}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ background: isPlaying ? ACCENT : BG, color: INK }}
                aria-label={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? <Pause className="w-3 h-3" fill="currentColor" /> : <Play className="w-3 h-3 ml-0.5" fill="currentColor" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Artistas em destaque
// ---------------------------------------------------------------------------

function FeaturedArtists() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <SectionHeader title="Artistas em destaque" subtitle="Vozes que estão a definir o som lusófono." action="Ver diretório" actionTo="/artists" />
      <div className="grid sm:grid-cols-3 gap-5">
        {FEATURED_ARTISTS.map((a) => (
          <div key={a.id} className="rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg" style={{ borderColor: BORDER, background: CARD, boxShadow: SHADOW }}>
            <PortraitArt className="w-full aspect-[4/5]" />
            <div className="p-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate" style={{ color: INK }}>{a.name}</p>
                  {a.verified && <Verified className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{a.genre}</p>
              </div>
              <Link to="/artists" className="shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full text-white transition-opacity hover:opacity-90" style={{ background: INK }}>
                Seguir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Novos talentos
// ---------------------------------------------------------------------------

function NewTalent() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-4">
      <SectionHeader title="Novos talentos" subtitle="Descobre artistas que estão a começar a conquistar espaço no ArtistHub." action="Explorar artistas" actionTo="/artists" />
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
        {NEW_TALENT.map((a) => (
          <div key={a.id} className="shrink-0 w-32 sm:w-auto text-center">
            <PortraitArt className="w-24 h-24 sm:w-full sm:aspect-square rounded-full sm:rounded-2xl mx-auto" />
            <p className="text-xs font-semibold mt-2.5 truncate" style={{ color: INK }}>{a.name}</p>
            <p className="text-[11px] truncate" style={{ color: MUTED }}>{a.genre}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Géneros
// ---------------------------------------------------------------------------

function Genres() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <SectionHeader title="Explorar por género" />
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
        {GENRES.map((g, i) => (
          <span
            key={g}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-colors"
            style={
              i === 0
                ? { background: ACCENT, borderColor: ACCENT, color: INK }
                : { background: CARD, borderColor: BORDER, color: INK }
            }
          >
            {g}
          </span>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Apoia um artista
// ---------------------------------------------------------------------------

function SupportSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <div className="rounded-3xl border p-6 sm:p-10" style={{ borderColor: BORDER, background: CARD, boxShadow: SHADOW }}>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5" style={{ color: INK }} />
          <h2 className="font-display text-2xl sm:text-3xl" style={{ color: INK }}>A música também vive do apoio dos fãs.</h2>
        </div>
        <p className="max-w-xl mb-8" style={{ color: MUTED }}>
          Gostaste de uma música? Apoia directamente o artista e ajuda-o a continuar a criar.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {SUPPORT_ARTISTS.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl p-3 border" style={{ borderColor: BORDER, background: BG }}>
              <PortraitArt className="w-11 h-11 rounded-full shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: INK }}>{a.name}</p>
                <Link to="/artists" className="text-[11px] font-semibold mt-0.5 inline-block" style={{ color: ACCENT }}>Apoiar</Link>
              </div>
            </div>
          ))}
        </div>

        <Link to="/artists" className="inline-block px-6 py-3 rounded-full font-medium transition-transform hover:scale-105" style={{ background: ACCENT, color: INK }}>
          Apoiar artistas
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Área para artistas
// ---------------------------------------------------------------------------

function ArtistCTA() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-4">
      <div className="rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: INK }}>
        <div>
          <p className="font-display text-2xl sm:text-3xl mb-2 text-white">A tua música merece ser ouvida.</p>
          <p className="max-w-md text-white/60">
            Lança a tua música, encontra novos fãs e acompanha o crescimento da tua carreira no ArtistHub.
          </p>
        </div>
        <Link to="/register" className="shrink-0 px-7 py-3.5 rounded-full font-medium transition-transform hover:scale-105" style={{ background: ACCENT, color: INK }}>
          Começar como artista
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Destaque principal
// ---------------------------------------------------------------------------

function MainSpotlight() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14">
      <SectionHeader title="Destaque ArtistHub" />
      <div className="rounded-3xl border p-6 sm:p-10 grid sm:grid-cols-[auto_1fr] gap-8 items-center" style={{ borderColor: BORDER, background: CARD, boxShadow: SHADOW }}>
        <CoverArt rounded="rounded-2xl" className="w-full sm:w-56 aspect-square shadow-xl" />
        <div>
          <span className="inline-flex items-center text-[11px] font-mono font-medium uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: `${ACCENT}1F`, color: ACCENT }}>
            Faixa do momento
          </span>
          <h3 className="font-display text-3xl sm:text-4xl mt-4 mb-1" style={{ color: INK }}>Prometo Te Amar</h3>
          <p className="text-base mb-6" style={{ color: MUTED }}>Nilton Xavier</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/listen" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-white transition-opacity hover:opacity-90" style={{ background: INK }}>
              <Play className="w-4 h-4" fill="currentColor" /> Ouvir
            </Link>
            <Link to="/artists" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium border transition-colors hover:bg-black/5" style={{ color: INK, borderColor: BORDER }}>
              <Heart className="w-4 h-4" /> Apoiar
            </Link>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Prometo Te Amar — Nilton Xavier', url: window.location.href });
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium border transition-colors hover:bg-black/5"
              style={{ color: INK, borderColor: BORDER }}
            >
              <Share2 className="w-4 h-4" /> Partilhar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Rodapé
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="border-t mt-12 sm:mt-20" style={{ borderColor: BORDER, background: CARD }}>
      <div className="max-w-6xl mx-auto px-5 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: INK }}>
            <Disc3 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg" style={{ color: INK }}>ArtistHub</span>
        </div>
        <p className="text-xs" style={{ color: MUTED }}>
          © {new Date().getFullYear()} ArtistHub. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4" style={{ color: MUTED }}>
          <a href="#" className="hover:opacity-75 transition-opacity" aria-label="Instagram">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="#" className="hover:opacity-75 transition-opacity" aria-label="YouTube">
            <Youtube className="w-4 h-4" />
          </a>
          <a href="#" className="hover:opacity-75 transition-opacity" aria-label="Facebook">
            <Facebook className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Player Bar (reprodução)
// ---------------------------------------------------------------------------

function PlayerBar({ playingId, onTogglePlay }: { playingId: string | null; onTogglePlay: () => void }) {
  if (!playingId) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md px-4 py-3"
      style={{
        background: `${CARD}F5`,
        borderColor: BORDER,
        boxShadow: '0 -4px 20px rgba(24,23,34,0.08)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <CoverArt rounded="rounded-lg" className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: INK }}>
              Prometo Te Amar
            </p>
            <p className="text-xs truncate" style={{ color: MUTED }}>
              Nilton Xavier & Jay Ilson Da Luzia
            </p>
          </div>
          <button
            className="hover:opacity-75 hidden sm:block ml-2 transition-opacity"
            style={{ color: MUTED }}
            aria-label="Gostar"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: INK }}
            aria-label="Anterior"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
            style={{ background: INK }}
            aria-label="Pausar"
          >
            <Pause className="w-4 h-4" fill="currentColor" />
          </button>
          <button
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: INK }}
            aria-label="Seguinte"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2" style={{ color: MUTED }}>
          <Volume2 className="w-4 h-4" />
          <div className="w-20 h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div className="w-3/4 h-full rounded-full" style={{ background: ACCENT }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página Principal
// ---------------------------------------------------------------------------

export default function Landing() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = (id: string) => {
    setPlayingId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK }}>
      <Header />
      <main className="space-y-4 pb-20">
        <Hero />
        <RecentReleases onPlay={handlePlay} playingId={playingId} />
        <TrendingRanking onPlay={handlePlay} playingId={playingId} />
        <FeaturedArtists />
        <NewTalent />
        <Genres />
        <SupportSection />
        <MainSpotlight />
        <ArtistCTA />
      </main>
      <Footer />
      <PlayerBar playingId={playingId} onTogglePlay={() => setPlayingId(null)} />
    </div>
  );
}
