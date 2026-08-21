import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyEmail() {
  const { user, sendVerification } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    try {
      setLoading(true);
      await sendVerification();
      setSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink-800 bg-ink-900/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cobalt-500/10 text-cobalt-400">
          <Mail size={32} />
        </div>

        <div>
          <h1 className="font-display text-2xl text-bone-100">Verifica o teu Email</h1>
          <p className="mt-2 text-sm text-bone-400">
            A tua conta ({user?.email}) ainda não foi verificada. A verificação garante a segurança da tua conta e acesso a todas as funcionalidades de monetização.
          </p>
        </div>

        {sent ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-teal-500/10 p-4 text-sm text-teal-400 border border-teal-500/20">
            <CheckCircle2 size={18} />
            Email de verificação enviado! Consulta a tua caixa de correio.
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={loading}
            className="w-full justify-center py-3"
          >
            {loading ? 'A enviar...' : 'Enviar Email de Verificação'}
          </Button>
        )}
      </div>
    </div>
  );
}
