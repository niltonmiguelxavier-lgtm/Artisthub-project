import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, Lock, User, Building2, Music, AlertCircle } from 'lucide-react';
import type { UserRole } from '../types';

export default function Register() {
  const [stageName, setStageName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('artist');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleRegister = async () => {
    try {
      setError('');
      setErrorDetails('');
      setGoogleLoading(true);
      await loginWithGoogle(role);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError('Falha ao registar com o Google: ' + (err.message || 'Tenta novamente.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName || !email || !password) {
      setError('Por favor preenche todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setError('');
      setErrorDetails('');
      setSubmitting(true);
      await register(email, password, stageName, role);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O método Email/Palavra-passe não está ativado na consola Firebase.');
        setErrorDetails('Por favor utiliza o botão "Registar com o Google" acima.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está registado. Tenta iniciar sessão.');
      } else {
        setError('Erro ao criar conta: ' + (err.message || 'Verifica os dados introduzidos.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-800 bg-ink-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cobalt-500 font-display text-xl font-bold text-ink-950">
            A
          </div>
          <h1 className="font-display text-2xl text-bone-100">Criar Nova Conta</h1>
          <p className="mt-1 text-sm text-bone-400">Junta-te à plataforma definitiva para músicos e organizadores</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-ink-800 bg-ink-950 p-1">
          <button
            type="button"
            onClick={() => setRole('artist')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
              role === 'artist'
                ? 'bg-cobalt-500 text-bone-100'
                : 'text-bone-400 hover:text-bone-200'
            }`}
          >
            <Music size={14} />
            Artista / Músico
          </button>
          <button
            type="button"
            onClick={() => setRole('organizer')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
              role === 'organizer'
                ? 'bg-cobalt-500 text-bone-100'
                : 'text-bone-400 hover:text-bone-200'
            }`}
          >
            <Building2 size={14} />
            Organizador / Produtor
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-sm text-rose-300">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
              <div>
                <p className="font-medium text-rose-300">{error}</p>
                {errorDetails && <p className="mt-1 text-xs text-rose-300/80">{errorDetails}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Primary Google Login */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-ink-700 bg-ink-800/80 px-4 py-2.5 text-sm font-medium text-bone-100 transition-colors hover:bg-ink-700 hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {googleLoading ? 'A conectar ao Google...' : 'Registar com o Google'}
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink-800"></div>
          </div>
          <span className="relative bg-ink-900 px-3 text-xs uppercase tracking-wider text-bone-500">
            ou com email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="register-name"
            label={role === 'artist' ? 'Nome Artístico' : 'Nome / Organização'}
            type="text"
            placeholder={role === 'artist' ? 'Ex: Nélio Kaya' : 'Ex: Festival Sol & Som'}
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            icon={<User size={16} />}
            required
          />

          <Input
            id="register-email"
            label="Email"
            type="email"
            placeholder="contacto@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            required
          />

          <Input
            id="register-password"
            label="Palavra-passe (mínimo 6 caracteres)"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center py-2.5 font-medium text-bone-100"
            disabled={submitting}
          >
            {submitting ? 'A criar conta...' : 'Concluir Registo'}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-bone-400">
          Já tens uma conta?{' '}
          <Link to="/login" className="font-medium text-cobalt-400 hover:underline">
            Entrar aqui
          </Link>
        </div>
      </div>
    </div>
  );
}
