import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  TrendingUp,
  Music2,
  Megaphone,
  Wallet,
  Users,
  Sparkles,
  Compass,
  Store,
  FileText,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ArtistAvatar from '../ArtistAvatar';
import Badge from '../ui/Badge';

export default function Sidebar() {
  const { artistProfile, user, logout } = useAuth();
  const navigate = useNavigate();

  const handle = artistProfile?.handle || 'nelio-kaya';
  const stageName = artistProfile?.stageName || user?.displayName || 'Artista';
  const isPro = artistProfile?.subscriptionTier === 'pro';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-ink-800 bg-ink-950 p-4 lg:flex sticky top-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-500 font-display text-base font-semibold text-ink-950">
              A
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-bone-100">
                ArtistHub
              </span>
            </div>
          </Link>
          {isPro && (
            <Badge tone="cobalt">
              <Crown size={11} className="mr-1 inline" /> PRO
            </Badge>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-5 text-xs font-medium" aria-label="Navegação lateral">
          {/* Principal */}
          <div className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                    : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                }`
              }
            >
              <LayoutDashboard size={17} />
              <span>Painel Geral</span>
            </NavLink>

            <NavLink
              to="/feed"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                    : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                }`
              }
            >
              <Radio size={17} className="text-teal-400" />
              <div className="flex flex-1 items-center justify-between">
                <span>Feed da Comunidade</span>
                <span className="inline-flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              </div>
            </NavLink>
          </div>

          {/* Grupo Carreira */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-bone-400">
              Carreira
            </div>
            <div className="space-y-1">
              <NavLink
                to="/career"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <TrendingUp size={17} />
                <span>Minha Carreira</span>
              </NavLink>

              <NavLink
                to="/music"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Music2 size={17} />
                <span>Músicas & Vídeos</span>
              </NavLink>

              <NavLink
                to="/promotion"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Megaphone size={17} />
                <span>Promoção</span>
              </NavLink>

              <NavLink
                to="/earnings"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Wallet size={17} />
                <span>Finanças & Ganhos</span>
              </NavLink>

              <NavLink
                to="/fans"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Users size={17} />
                <span>Fãs & Audiência</span>
              </NavLink>
            </div>
          </div>

          {/* Grupo Comunidade & Oportunidades */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-bone-400">
              Comunidade & Descoberta
            </div>
            <div className="space-y-1">
              <NavLink
                to="/listen"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Music2 size={17} className="text-cobalt-400" />
                <span>Ouvir Música</span>
              </NavLink>

              <NavLink
                to="/artists"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Sparkles size={17} className="text-teal-400" />
                <span>Explorar Artistas</span>
              </NavLink>

              <NavLink
                to="/opportunities"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Compass size={17} />
                <span>Oportunidades</span>
              </NavLink>
            </div>
          </div>

          {/* Grupo Negócio */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-bone-400">
              Negócio
            </div>
            <div className="space-y-1">
              <NavLink
                to="/store"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Store size={17} />
                <span>Loja Oficial & Beats</span>
              </NavLink>

              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <FileText size={17} />
                <span>Documentos</span>
              </NavLink>

              <NavLink
                to="/messages"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <MessageSquare size={17} />
                <span>Mensagens</span>
              </NavLink>
            </div>
          </div>

          {/* Grupo Conta */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-bone-400">
              Conta
            </div>
            <div className="space-y-1">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cobalt-500/10 text-cobalt-400 font-semibold'
                      : 'text-bone-300 hover:bg-ink-900 hover:text-bone-100'
                  }`
                }
              >
                <Settings size={17} />
                <span>Definições</span>
              </NavLink>
            </div>
          </div>
        </nav>
      </div>

      {/* Footer Profile & External Link */}
      <div className="space-y-3 pt-4 border-t border-ink-800/80">
        <Link
          to={`/artist/${handle}`}
          target="_blank"
          className="flex items-center justify-between rounded-xl bg-ink-900 px-3 py-2 text-xs font-medium text-bone-200 transition-colors hover:bg-ink-800 hover:text-bone-100"
        >
          <span className="flex items-center gap-2">
            <ExternalLink size={14} className="text-cobalt-400" />
            Perfil Público
          </span>
          <span className="text-[10px] text-bone-400">/{handle}</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <ArtistAvatar
              name={stageName}
              src={artistProfile?.avatarUrl}
              size={32}
              verified={artistProfile?.verified || isPro}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-bone-100">{stageName}</p>
              <p className="truncate text-[10px] text-bone-400">{user?.email || 'artista@artisthub.app'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Terminar sessão"
            className="rounded-lg p-1.5 text-bone-400 hover:bg-ink-900 hover:text-rose-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
