import React from 'react';
import { Plus, Music2 } from 'lucide-react';
import Button from '../components/ui/Button';
import MusicCard from '../components/cards/MusicCard';
import EmptyState from '../components/ui/EmptyState';
import { tracks } from '../data/music';

export default function Music() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Música</h1>
          <p className="mt-1 text-sm text-bone-400">Todos os teus lançamentos, num só lugar.</p>
        </div>
        <Button icon={<Plus size={16} />}>Adicionar música</Button>
      </div>

      {tracks.length > 0 ? (
        <div className="space-y-3">
          {tracks.map((track) => (
            <MusicCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Music2 size={32} />}
          title="Ainda não tens músicas"
          description="Adiciona o teu primeiro lançamento para começares a acompanhar streams e receitas."
          action={<Button icon={<Plus size={16} />}>Adicionar música</Button>}
        />
      )}
    </div>
  );
}
