import React from 'react';
import { FileText, Plus } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

const categories = ['Contratos', 'Comprovativos fiscais', 'Direitos autorais', 'Identificação'];

export default function Documents() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Documentos</h1>
          <p className="mt-1 text-sm text-bone-400">Guarda contratos, comprovativos e informação profissional.</p>
        </div>
        <Button icon={<Plus size={16} />}>Adicionar documento</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c} className="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <FileText size={18} className="mb-2 text-cobalt-400" />
            <p className="text-sm text-bone-100">{c}</p>
            <p className="mt-0.5 text-xs text-bone-400">0 ficheiros</p>
          </div>
        ))}
      </div>

      <EmptyState
        icon={<FileText size={32} />}
        title="Ainda não tens documentos guardados"
        description="Organiza contratos, comprovativos fiscais e outra informação importante da tua carreira."
        action={<Button icon={<Plus size={16} />}>Adicionar documento</Button>}
      />
    </div>
  );
}
