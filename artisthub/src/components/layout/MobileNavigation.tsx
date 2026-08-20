import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music2, Megaphone, Wallet, Menu } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/music', label: 'Música', icon: Music2 },
  { to: '/promotion', label: 'Promoção', icon: Megaphone },
  { to: '/earnings', label: 'Finanças', icon: Wallet },
];

interface MobileNavigationProps {
  onOpenMore: () => void;
}

export default function MobileNavigation({ onOpenMore }: MobileNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-ink-800 bg-ink-900/95 backdrop-blur lg:hidden">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              isActive ? 'text-brass-400' : 'text-bone-400'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
      <button
        onClick={onOpenMore}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-bone-400"
      >
        <Menu size={20} strokeWidth={1.75} />
        Mais
      </button>
    </nav>
  );
}
