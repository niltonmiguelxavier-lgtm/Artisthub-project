import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Music2,
  Megaphone,
  Users,
  Wallet,
  Compass,
  Store,
  FileText,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/career', label: 'Minha carreira', icon: TrendingUp },
  { to: '/music', label: 'Música & Vídeos', icon: Music2 },
  { to: '/promotion', label: 'Promoção', icon: Megaphone },
  { to: '/fans', label: 'Fãs', icon: Users },
  { to: '/earnings', label: 'Finanças', icon: Wallet },
  { to: '/opportunities', label: 'Oportunidades', icon: Compass },
  { to: '/store', label: 'Loja', icon: Store },
  { to: '/documents', label: 'Documentos', icon: FileText },
  { to: '/settings', label: 'Definições', icon: Settings },
];

export default function Sidebar() {
  const { artistProfile } = useAuth();
  const handle = artistProfile?.handle || 'nelio-kaya';

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900 lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cobalt-500 font-display text-base font-semibold text-ink-950">
          A
        </div>
        <span className="font-display text-lg text-bone-100">ArtistHub</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-ink-800 text-cobalt-400 font-medium'
                  : 'text-bone-300 hover:bg-ink-800/60 hover:text-bone-100'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 px-3 py-4">
        <NavLink
          to={`/artist/${handle}`}
          target="_blank"
          className="flex items-center justify-between rounded-xl border border-ink-700 px-3 py-2.5 text-sm text-bone-300 hover:border-cobalt-500 hover:text-cobalt-400 transition-colors"
        >
          Ver meu perfil público
          <ExternalLink size={15} />
        </NavLink>
      </div>
    </aside>
  );
}
