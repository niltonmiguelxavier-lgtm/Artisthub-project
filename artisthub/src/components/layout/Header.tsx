import React, { useState } from 'react';
import { Bell, ChevronDown, Search } from 'lucide-react';
import ArtistAvatar from '../ArtistAvatar';
import { currentArtist } from '../../data/artists';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink-800 bg-ink-950/90 px-4 py-3.5 backdrop-blur lg:px-8">
      <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-sm text-bone-400 sm:flex">
        <Search size={16} />
        <span>Pesquisar na tua carreira…</span>
      </div>

      <div className="flex items-center gap-3 sm:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass-500 font-display text-sm font-semibold text-ink-950">
          A
        </div>
        <span className="font-display text-base text-bone-100">ArtistHub</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <button
          aria-label="Notificações"
          className="relative rounded-full p-2 text-bone-300 hover:bg-ink-800 hover:text-bone-100"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-clay-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-ink-800"
          >
            <ArtistAvatar name={currentArtist.stageName} size={32} verified={currentArtist.verified} />
            <span className="hidden text-sm text-bone-100 sm:block">{currentArtist.stageName}</span>
            <ChevronDown size={15} className="hidden text-bone-400 sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 py-1 shadow-xl">
              <a href="#" className="block px-4 py-2.5 text-sm text-bone-300 hover:bg-ink-800">
                Ver perfil público
              </a>
              <a href="#" className="block px-4 py-2.5 text-sm text-bone-300 hover:bg-ink-800">
                Definições
              </a>
              <a href="#" className="block px-4 py-2.5 text-sm text-clay-400 hover:bg-ink-800">
                Terminar sessão
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
