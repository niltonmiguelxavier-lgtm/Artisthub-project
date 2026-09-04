import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface PageLoadingErrorProps {
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export default function PageLoadingError({
  error = 'Não foi possível carregar os dados. Tenta novamente.',
  onRetry,
  title = 'Erro no carregamento',
  className = '',
}: PageLoadingErrorProps) {
  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 sm:p-8 text-center space-y-4 ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
        <AlertTriangle size={24} />
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-lg text-bone-100">{title}</h3>
        <p className="mx-auto max-w-md text-xs sm:text-sm text-bone-300">
          {error || 'Ocorreu um erro ao comunicar com a base de dados. Por favor verifica a tua ligação.'}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2 flex justify-center">
          <Button variant="primary" onClick={onRetry} className="gap-2 text-xs font-semibold px-5">
            <RefreshCw size={14} />
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
