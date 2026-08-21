import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';

interface EmailVerificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string;
}

export default function EmailVerificationPromptModal({
  isOpen,
  onClose,
  actionName = 'esta ação',
}: EmailVerificationPromptModalProps) {
  const { user, sendVerification, reloadUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

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
          text: 'Email verificado com sucesso! Já podes prosseguir.',
          type: 'success',
        });
        setTimeout(() => {
          onClose();
        }, 1200);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Verificação de Email Obrigatória">
      <div className="space-y-5 text-center sm:text-left">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
            <Mail size={24} />
          </div>
          <div>
            <h4 className="font-display text-base text-bone-100">
              Confirma o teu endereço de email
            </h4>
            <p className="mt-1 text-xs text-bone-400">
              Para {actionName}, é necessário ter o endereço de email (<strong>{user?.email}</strong>) verificado na plataforma.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
              feedback.type === 'success'
                ? 'border border-teal-500/30 bg-teal-500/10 text-teal-300'
                : feedback.type === 'info'
                ? 'border border-cobalt-500/30 bg-cobalt-500/10 text-cobalt-300'
                : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end pt-3 border-t border-ink-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Fechar
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleResend}
            disabled={resending}
            className="gap-1.5"
          >
            <Send size={14} />
            {resending ? 'A enviar...' : 'Reenviar Email'}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleCheckStatus}
            disabled={checking}
            className="gap-1.5"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {checking ? 'A verificar...' : 'Já verifiquei'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
