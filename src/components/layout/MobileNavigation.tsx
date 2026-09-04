import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, Music2, Compass, Menu } from 'lucide-react';
import MobileMenuSheet from './MobileMenuSheet';

export default function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Highlight "Menu" if the current route is one of the sub-menu pages
  const isSubRoute = [
    '/career',
    '/promotion',
    '/earnings',
    '/fans',
    '/artists',
    '/artists-hub',
    '/store',
    '/documents',
    '/settings',
  ].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  return (
    <>
      <nav
        aria-label="Navegação móvel"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-800 bg-ink-950/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
          {/* 1. Início */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-center transition-colors ${
                isActive ? 'text-cobalt-400 font-semibold' : 'text-bone-400 hover:text-bone-200'
              }`
            }
          >
            <LayoutDashboard size={20} className="shrink-0" />
            <span className="mt-1 text-[11px] leading-none whitespace-nowrap">Início</span>
          </NavLink>

          {/* 2. Feed */}
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-center transition-colors ${
                isActive ? 'text-cobalt-400 font-semibold' : 'text-bone-400 hover:text-bone-200'
              }`
            }
          >
            <Radio size={20} className="shrink-0" />
            <span className="mt-1 text-[11px] leading-none whitespace-nowrap">Feed</span>
          </NavLink>

          {/* 3. Música */}
          <NavLink
            to="/music"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-center transition-colors ${
                isActive ? 'text-cobalt-400 font-semibold' : 'text-bone-400 hover:text-bone-200'
              }`
            }
          >
            <Music2 size={20} className="shrink-0" />
            <span className="mt-1 text-[11px] leading-none whitespace-nowrap">Música</span>
          </NavLink>

          {/* 4. Oportunidades */}
          <NavLink
            to="/opportunities"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-center transition-colors ${
                isActive ? 'text-cobalt-400 font-semibold' : 'text-bone-400 hover:text-bone-200'
              }`
            }
          >
            <Compass size={20} className="shrink-0" />
            <span className="mt-1 text-[11px] leading-none whitespace-nowrap">Oportunidades</span>
          </NavLink>

          {/* 5. Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu de opções"
            className={`flex flex-1 flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-center transition-colors ${
              isMenuOpen || isSubRoute
                ? 'text-cobalt-400 font-semibold'
                : 'text-bone-400 hover:text-bone-200'
            }`}
          >
            <Menu size={20} className="shrink-0" />
            <span className="mt-1 text-[11px] leading-none whitespace-nowrap">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-over / Bottom Sheet */}
      <MobileMenuSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
