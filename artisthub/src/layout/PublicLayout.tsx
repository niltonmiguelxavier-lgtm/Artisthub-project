import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass-500 font-display text-base font-semibold text-ink-950">
              A
            </div>
            <span className="font-display text-lg text-bone-100">ArtistHub</span>
          </Link>
          <Link
            to="/dashboard"
            className="rounded-full bg-brass-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-brass-400"
          >
            Entrar no dashboard
          </Link>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-ink-800 px-5 py-10 text-center text-xs text-bone-400">
        © {new Date().getFullYear()} ArtistHub. Feito para artistas africanos e internacionais.
      </footer>
    </div>
  );
}
