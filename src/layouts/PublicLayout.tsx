import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function PublicLayout() {
  const { user, artistProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-950 text-bone-100 antialiased flex flex-col justify-between">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-500 font-display text-base font-semibold text-ink-950">
              A
            </div>
            <span className="font-display text-lg text-bone-100">ArtistHub</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              to="/store"
              className="text-xs font-medium text-bone-300 hover:text-bone-100 px-3 py-1.5 transition-colors"
            >
              Loja & Beats
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="rounded-full bg-cobalt-500 px-4 py-2 text-xs font-medium text-bone-100 hover:bg-cobalt-600 transition-colors"
                >
                  Dashboard ({artistProfile?.stageName || 'Artista'})
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-bone-300 hover:text-bone-100 px-3 py-1.5 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-cobalt-500 px-4 py-2 text-xs font-medium text-bone-100 hover:bg-cobalt-600 transition-colors"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8 flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-800 bg-ink-950/50 py-8 text-center text-xs text-bone-400">
        <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ArtistHub — Plataforma de Gestão e Carreira Musical.</p>
          <div className="flex items-center gap-4">
            <Link to="/store" className="hover:text-bone-200">Loja Digital</Link>
            <Link to="/login" className="hover:text-bone-200">Área de Artistas</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
