import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import MobileNavigation from '../components/layout/MobileNavigation';
import Header from '../components/layout/Header';
import { Store, FileText, Settings, X } from 'lucide-react';

export default function DashboardLayout() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNavigation onOpenMore={() => setMoreOpen(true)} />

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button className="absolute inset-0 bg-ink-950/80" onClick={() => setMoreOpen(false)} aria-label="Fechar" />
          <div className="relative w-full rounded-t-2xl border border-ink-700 bg-ink-900 p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base text-bone-100">Mais</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Fechar">
                <X size={18} className="text-bone-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { to: '/opportunities', label: 'Oportunidades', icon: Store },
                { to: '/fans', label: 'Fãs', icon: FileText },
                { to: '/settings', label: 'Definições', icon: Settings },
              ].map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-ink-800 py-4 text-xs text-bone-300"
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
