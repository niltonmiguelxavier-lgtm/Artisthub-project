import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setError('');
      setSubmitting(true);
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível enviar as instruções. Verifica se o email está correto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-800 bg-ink-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl text-bone-100">Recuperar Palavra-passe</h1>
          <p className="mt-1 text-sm text-bone-400">
            Introduz o teu email para receberes um link de recuperação.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-sm text-bone-200">
              Enviámos um email para <strong className="text-bone-100">{email}</strong> com instruções para redefinir a tua palavra-passe.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button variant="outline" className="w-full justify-center">
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <Input
              id="reset-email"
              label="Email"
              type="email"
              placeholder="artista@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-3 font-medium text-bone-100"
              disabled={submitting}
            >
              {submitting ? 'A enviar...' : 'Enviar Instruções'}
            </Button>

            <div className="pt-2 text-center text-xs text-bone-400">
              Lembraste-te da palavra-passe?{' '}
              <Link to="/login" className="text-cobalt-400 hover:underline">
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
