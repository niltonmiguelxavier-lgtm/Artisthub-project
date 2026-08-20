import React from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function Store() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Loja</h1>
        <p className="mt-1 text-sm text-bone-400">Vende merchandise, presets e produtos digitais aos teus fãs.</p>
      </div>
      <EmptyState
        icon={<ShoppingBag size={32} />}
        title="A tua loja está vazia"
        description="Adiciona o teu primeiro produto para começares a vender directamente aos teus fãs."
        action={<Button icon={<Plus size={16} />}>Adicionar produto</Button>}
      />
    </div>
  );
}
