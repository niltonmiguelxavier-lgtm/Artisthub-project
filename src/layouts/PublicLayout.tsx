import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Radio, Store as StoreIcon, Sparkles } from 'lucide-react';
import MobileNavigation from '../components/layout/MobileNavigation';

export default function PublicLayout() {
  const { user, artistProfile, logout } = useAuth();
  const location = useLocation();

  if (location.pathname === '/') {
    return (
      <div className="min-h-screen w-full min-w-0 max-w-full bg-[#FAF9F6] text-[#18171F] antialiased">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-ink-950 text-bone-100 antialiased flex flex-col justify-between">
      <header className="sticky top-0 z-50 w-full shrink-0 border-b border-ink-800 bg-ink-950/95 backdrop-blur-md transition-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-500 font-display text-base font-semibold text-ink-950">
              A
            </div>
            <span className="font-display text-lg text-bone-100">ArtistHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3" aria-label="Navegação pública">
            <Link
              to="/listen"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                location.pathname === '/listen'
                  ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                  : 'text-bone-300 hover:text-bone-100'
              }`}
            >
              Ouvir Música
            </Link>

            <Link
              to="/feed"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                location.pathname === '/feed'
                  ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                  : 'text-bone-300 hover:text-bone-100'
              }`}
            >
              Feed da Comunidade
            </Link>

            <Link
              to="/artists"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                location.pathname === '/artists'
                  ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                  : 'text-bone-300 hover:text-bone-100'
              }`}
            >
              Explorar Artistas
            </Link>

            <Link
              to="/store"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                location.pathname === '/store'
                  ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                  : 'text-bone-300 hover:text-bone-100'
              }`}
            >
              Loja & Beats
            </Link>

            {user ? (
              <div className="flex items-center gap-3 ml-2 border-l border-ink-800 pl-3">
                <Link
                  to="/dashboard"
                  className="rounded-full bg-cobalt-500 px-4 py-1.5 text-xs font-medium text-bone-100 hover:bg-cobalt-600 transition-colors truncate max-w-[200px]"
                >
                  Painel ({artistProfile?.stageName || 'Artista'})
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-bone-400 hover:text-rose-400 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2 border-l border-ink-800 pl-3">
                <Link
                  to="/login"
                  className="text-xs font-medium text-bone-300 hover:text-bone-100 px-3 py-1.5 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-cobalt-500 px-3.5 py-1.5 text-xs font-medium text-bone-100 hover:bg-cobalt-600 transition-colors"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Right Actions */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-full bg-cobalt-500/15 border border-cobalt-500/30 px-3 py-1.5 text-xs font-semibold text-cobalt-400"
              >
                <LayoutDashboard size={14} />
                <span>Painel</span>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="rounded-lg px-2.5 py-1.5 text-xs text-bone-300 hover:text-bone-100"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-cobalt-500 px-3 py-1.5 text-xs font-semibold text-bone-100 hover:bg-cobalt-600"
                >
                  Registar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3.5 sm:px-5 py-6 sm:py-8 pb-44 lg:pb-28 flex-1 min-w-0">
        <Outlet />
      </main>

      {/* Unified Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}
