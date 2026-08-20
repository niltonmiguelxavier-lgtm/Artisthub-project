import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import CampaignCard from '../components/cards/CampaignCard';
import { campaigns } from '../data/campaigns';

export default function Promotion() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Promoção</h1>
          <p className="mt-1 text-sm text-bone-400">Acompanha o alcance e o desempenho das tuas campanhas.</p>
        </div>
        <Button icon={<Plus size={16} />}>Criar campanha</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}
