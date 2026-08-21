import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import MobileNavigation from '../components/layout/MobileNavigation';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, RefreshCw, Send } from 'lucide-react';

export default function DashboardLayout() {
  const { user, sendVerification, reloadUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isEmailUnverified = Boolean(user && !user.emailVerified);

  const handleResend = async () => {
    try {
      setResending(true);
      setFeedback(null);
      await sendVerification();
      setFeedback({
        text: 'Email de verificação enviado! Verifica a tua caixa de entrada ou spam.',
        type: 'success',
      });
    } catch (e: any) {
      setFeedback({
        text: 'Erro ao enviar email: ' + (e.message || 'Tenta novamente mais tarde.'),
        type: 'error',
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      const isVerified = await reloadUser();
      if (isVerified) {
        setFeedback({
          text: 'Conta verificada com sucesso!',
          type: 'success',
        });
      } else {
        setFeedback({
          text: 'O teu email ainda não foi confirmado no link recebido.',
          type: 'info',
        });
      }
    } catch (e) {
      setFeedback({
        text: 'Erro ao atualizar estado.',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950 text-bone-100 antialiased">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        {/* Email verification alert banner */}
        {isEmailUnverified && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                <span>
                  O teu email (<strong>{user?.email}</strong>) ainda não foi verificado.
                  Verifica o teu email para desbloquear a adição de músicas, vendas na loja e publicação de oportunidades.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1 rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/30"
                >
                  <Send size={12} />
                  {resending ? 'A enviar...' : 'Reenviar Email'}
                </button>
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="flex items-center gap-1 rounded-lg border border-amber-400/40 px-2.5 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/10"
                >
                  <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                  {checking ? 'A verificar...' : 'Já verifiquei'}
                </button>
              </div>
            </div>
            {feedback && (
              <div className="mx-auto mt-2 max-w-6xl text-[11px] font-medium text-amber-300">
                {feedback.text}
              </div>
            )}
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
        <MobileNavigation />
      </div>
    </div>
  );
}

