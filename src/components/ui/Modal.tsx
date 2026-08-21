import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, isOpen, onClose, title, children }: ModalProps) {
  const isVisible = open ?? isOpen ?? false;
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between sticky top-0 bg-ink-850 pb-2 z-10">
          <h3 className="font-display text-xl text-bone-100">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-bone-400 hover:bg-ink-800 hover:text-bone-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
