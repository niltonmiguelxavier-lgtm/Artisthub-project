import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import ArtistProfile from './pages/ArtistProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import StoreSuccess from './pages/StoreSuccess';

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
    <AuthProvider>
      <AudioProvider>
        <Routes>
          {/* Public-facing pages (Landing, Public Artist Profile, Store, Auth) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/artist/:handle" element={<ArtistProfile />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/success" element={<StoreSuccess />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Authenticated artist dashboard (Protected) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/career" element={<Career />} />
            <Route path="/music" element={<Music />} />
            <Route path="/promotion" element={<Promotion />} />
            <Route path="/fans" element={<Fans />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AudioProvider>
    </AuthProvider>
  );
}
