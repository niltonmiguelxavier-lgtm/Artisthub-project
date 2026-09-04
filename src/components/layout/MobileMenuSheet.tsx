import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  X,
  TrendingUp,
  Megaphone,
  Wallet,
  Users,
  Music2,
  Sparkles,
  ExternalLink,
  Store,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ArtistAvatar from '../ArtistAvatar';

export interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenuSheet({ isOpen, onClose }: MobileMenuSheetProps) {
  const { artistProfile, user, logout } = useAuth();
  const navigate = useNavigate();

  const handle = artistProfile?.handle || 'nelio-kaya';
  const stageName = artistProfile?.stageName || user?.displayName || (user ? 'Artista' : 'Visitante');
  const isPro = artistProfile?.subscriptionTier === 'pro';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll gently when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de Navegação"
        className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-900 shadow-2xl pb-8"
      >
        {/* Drag Handle Bar & Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-800 bg-ink-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {user ? (
              <ArtistAvatar
                name={stageName}
                src={artistProfile?.avatarUrl}
                size={36}
                verified={artistProfile?.verified || isPro}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt-500 font-display text-base font-bold text-ink-950">
                A
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-bone-100">{stageName}</p>
              <p className="truncate text-xs text-bone-400">
                {user ? `@${handle}` : 'Plataforma para Artistas'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-800 text-bone-300 hover:bg-ink-750 hover:text-bone-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-4 py-4">
          {/* Guest CTA if not logged in */}
          {!user && (
            <div className="rounded-2xl border border-cobalt-500/20 bg-cobalt-500/10 p-4 space-y-3">
              <p className="text-xs text-bone-200">
                Cria a tua conta de artista para organizar lançamentos, gerir finanças e aceder a oportunidades.
              </p>
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex-1 text-center rounded-xl bg-ink-800 py-2 text-xs font-semibold text-bone-100 hover:bg-ink-750"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="flex-1 text-center rounded-xl bg-cobalt-500 py-2 text-xs font-semibold text-bone-100 hover:bg-cobalt-600"
                >
                  Criar Conta
                </Link>
              </div>
            </div>
          )}

          {/* Grupo Carreira */}
          <div>
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-bone-400">
              Carreira & Diagnóstico
            </span>
            <div className="mt-1 space-y-1">
              <NavLink
                to="/career"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-cobalt-400" />
                  Minha carreira (diagnóstico)
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>

              <NavLink
                to="/promotion"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Megaphone size={18} className="text-cobalt-400" />
                  Promoção & Campanhas
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>

              <NavLink
                to="/earnings"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Wallet size={18} className="text-cobalt-400" />
                  Finanças & Ganhos
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>

              <NavLink
                to="/fans"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Users size={18} className="text-cobalt-400" />
                  Fãs & Audiência
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>
            </div>
          </div>

          {/* Grupo Comunidade */}
          <div>
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-bone-400">
              Comunidade & Música
            </span>
            <div className="mt-1 space-y-1">
              <NavLink
                to="/listen"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Music2 size={18} className="text-cobalt-400" />
                  Ouvir Música (Catálogo Público)
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>

              <NavLink
                to="/artists"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Sparkles size={18} className="text-teal-400" />
                  Explorar artistas
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>

              {user && (
                <Link
                  to={`/artist/${handle}`}
                  target="_blank"
                  onClick={onClose}
                  className="flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-bone-200 hover:bg-ink-800 hover:text-bone-100 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <ExternalLink size={18} className="text-cobalt-400" />
                    Ver meu perfil público
                  </span>
                  <ExternalLink size={14} className="text-bone-400" />
                </Link>
              )}
            </div>
          </div>

          {/* Grupo Negócio */}
          <div>
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-bone-400">
              Negócio
            </span>
            <div className="mt-1 space-y-1">
              <NavLink
                to="/store"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Store size={18} className="text-cobalt-400" />
                  Loja Oficial & Beats
                </span>
                <ChevronRight size={16} className="text-bone-400" />
              </NavLink>

              {user && (
                <NavLink
                  to="/documents"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                        : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <FileText size={18} className="text-cobalt-400" />
                    Documentos & Contratos
                  </span>
                  <ChevronRight size={16} className="text-bone-400" />
                </NavLink>
              )}
            </div>
          </div>

          {/* Grupo Conta (se autenticado) */}
          {user && (
            <div>
              <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-bone-400">
                Conta & Definições
              </span>
              <div className="mt-1 space-y-1">
                <NavLink
                  to="/settings"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                        : 'text-bone-200 hover:bg-ink-800 hover:text-bone-100'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <Settings size={18} className="text-cobalt-400" />
                    Definições & Plano PRO
                  </span>
                  <ChevronRight size={16} className="text-bone-400" />
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <LogOut size={18} />
                    Terminar sessão
                  </span>
                  <ChevronRight size={16} className="text-rose-400/60" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
