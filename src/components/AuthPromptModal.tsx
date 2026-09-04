import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Music2, ArrowRight } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  title = 'Junta-te à comunidade ArtistHub',
  description = 'Cria uma conta gratuita ou entra para apoiar artistas com gostos, partilhar as tuas faixas e interagir.',
}: AuthPromptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 py-2">
        <div className="flex items-center justify-center py-3">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cobalt-500/20 to-rose-500/20 text-rose-400">
            <Heart size={32} fill="currentColor" className="animate-pulse" />
          </div>
        </div>

        <p className="text-center text-sm text-bone-300 leading-relaxed">
          {description}
        </p>

        <div className="space-y-2.5 pt-3">
          <Link to="/register" onClick={onClose} className="block w-full">
            <Button variant="primary" className="w-full justify-center gap-2">
              <Sparkles size={16} />
              Criar Conta Grátis
            </Button>
          </Link>

          <Link to="/login" onClick={onClose} className="block w-full">
            <Button variant="secondary" className="w-full justify-center">
              Já tenho conta (Entrar)
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
