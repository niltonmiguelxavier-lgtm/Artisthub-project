import React, { useState } from 'react';
import { Megaphone, Plus, Share2, Sparkles, Target, Users, CheckCircle2 } from 'lucide-react';
import StatCard from '../components/cards/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

interface Campaign {
  id: string;
  name: string;
  platform: 'TikTok' | 'Instagram' | 'Spotify' | 'YouTube';
  budget: number;
  spent: number;
  status: 'ativa' | 'concluida' | 'planeada';
  reach: number;
  clicks: number;
}

const initialCampaigns: Campaign[] = [
  {
    id: 'c-1',
    name: 'Lançamento Prometo Te Amar (Viral Reels)',
    platform: 'Instagram',
    budget: 5000,
    spent: 3200,
    status: 'ativa',
    reach: 48500,
    clicks: 1420,
  },
  {
    id: 'c-2',
    name: 'Desafio TikTok Beat & Dança',
    platform: 'TikTok',
    budget: 8000,
    spent: 8000,
    status: 'concluida',
    reach: 120400,
    clicks: 5800,
  },
];

export default function Promotion() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'TikTok' | 'Instagram' | 'Spotify' | 'YouTube'>('Instagram');
  const [budget, setBudget] = useState(3000);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newCamp: Campaign = {
      id: 'c-' + Date.now(),
      name,
      platform,
      budget: Number(budget),
      spent: 0,
      status: 'ativa',
      reach: 0,
      clicks: 0,
    };
    setCampaigns([newCamp, ...campaigns]);
    setModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Promoção & Campanhas</h1>
          <p className="mt-1 text-sm text-bone-400">
            Acompanha o alcance das tuas divulgações e acelera o crescimento do teu público.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="gap-2">
          <Plus size={16} />
          Nova Campanha
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Alcance Total" value="168,900" icon={Users} trend={{ value: '+28%', positive: true }} />
        <StatCard label="Cliques Gerados" value="7,220" icon={Target} trend={{ value: '+15%', positive: true }} />
        <StatCard label="Campanhas Ativas" value={campaigns.filter((c) => c.status === 'ativa').length.toString()} icon={Megaphone} />
        <StatCard label="Taxa de Conversão" value="4.2%" icon={Sparkles} />
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg text-bone-100">Campanhas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((camp) => (
            <div key={camp.id} className="rounded-2xl border border-ink-800 bg-ink-900 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge tone={camp.status === 'ativa' ? 'cobalt' : 'neutral'}>
                    {camp.platform} • {camp.status}
                  </Badge>
                  <h3 className="mt-2 font-display text-base text-bone-100">{camp.name}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-bone-300">
                <div className="rounded-xl bg-ink-950 p-2.5">
                  <span className="text-bone-400 block mb-0.5">Alcance</span>
                  <strong className="text-bone-100 font-mono-data text-sm">{camp.reach.toLocaleString()}</strong>
                </div>
                <div className="rounded-xl bg-ink-950 p-2.5">
                  <span className="text-bone-400 block mb-0.5">Cliques</span>
                  <strong className="text-teal-400 font-mono-data text-sm">{camp.clicks.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Criar Campanha de Promoção">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="camp-name"
            label="Nome da Campanha *"
            placeholder="Ex: Teaser Álbum no TikTok"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-bone-300">Plataforma</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            >
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Spotify">Spotify</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>

          <Input
            id="camp-budget"
            label="Orçamento Estimado (MT)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-ink-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Lançar Campanha</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
