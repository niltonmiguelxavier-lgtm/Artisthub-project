import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Landing from './pages/Landing';
import ArtistProfile from './pages/ArtistProfile';

import Dashboard from './pages/Dashboard';
import Career from './pages/Career';
import Music from './pages/Music';
import Promotion from './pages/Promotion';
import Fans from './pages/Fans';
import Earnings from './pages/Earnings';
import Opportunities from './pages/Opportunities';
import Store from './pages/Store';
import Documents from './pages/Documents';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      {/* Public-facing pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/artist/:handle" element={<ArtistProfile />} />
      </Route>

      {/* Authenticated artist dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/career" element={<Career />} />
        <Route path="/music" element={<Music />} />
        <Route path="/promotion" element={<Promotion />} />
        <Route path="/fans" element={<Fans />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/store" element={<Store />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
