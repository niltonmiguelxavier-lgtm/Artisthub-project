import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Search, Crown, LogOut, User, Settings } from 'lucide-react';
import ArtistAvatar from '../ArtistAvatar';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { artistProfile, user, logout } = useAuth();
  const navigate = useNavigate();

  const stageName = artistProfile?.stageName || user?.email?.split('@')[0] || 'Artista';
  const handle = artistProfile?.handle || 'nelio-kaya';
  const isPro = artistProfile?.subscriptionTier === 'pro';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink-800 bg-ink-950/90 px-4 py-3.5 backdrop-blur lg:px-8">
      <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm text-bone-400 sm:flex">
        <Search size={16} />
        <span>Pesquisar na tua carreira…</span>
      </div>

      <div className="flex items-center gap-3 sm:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cobalt-500 font-display text-sm font-semibold text-ink-950">
          A
        </div>
        <span className="font-display text-base text-bone-100">ArtistHub</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        {isPro && (
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-cobalt-500/30 bg-cobalt-500/10 px-2.5 py-1 text-xs font-semibold text-cobalt-400">
            <Crown size={13} />
            PRO
          </div>
        )}

        <button
          aria-label="Notificações"
          className="relative rounded-full p-2 text-bone-300 hover:bg-ink-800 hover:text-bone-100"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cobalt-400" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-ink-800"
          >
            <ArtistAvatar
              name={stageName}
              src={artistProfile?.avatarUrl}
              size={32}
              verified={artistProfile?.verified || isPro}
            />
            <span className="hidden text-sm text-bone-100 sm:block">{stageName}</span>
            <ChevronDown size={15} className="hidden text-bone-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 py-1.5 shadow-xl z-50">
              <Link
                to={`/artist/${handle}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone-200 hover:bg-ink-800"
              >
                <User size={15} />
                Ver perfil público
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-bone-200 hover:bg-ink-800"
              >
                <Settings size={15} />
                Definições & Subscrição
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-ink-800 text-left"
              >
                <LogOut size={15} />
                Terminar sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
