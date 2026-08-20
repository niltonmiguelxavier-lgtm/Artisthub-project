import React from 'react';
import { User, Bell, Shield, CreditCard } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ArtistAvatar from '../components/ArtistAvatar';
import { currentArtist } from '../data/artists';

const sections = [
  { icon: User, label: 'Perfil' },
  { icon: Bell, label: 'Notificações' },
  { icon: Shield, label: 'Privacidade e segurança' },
  { icon: CreditCard, label: 'Pagamentos' },
];

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Definições</h1>
        <p className="mt-1 text-sm text-bone-400">Gere o teu perfil e as preferências da tua conta.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {sections.map(({ icon: Icon, label }, i) => (
            <button
              key={label}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm ${
                i === 0 ? 'bg-ink-800 text-brass-400' : 'text-bone-300 hover:bg-ink-800/60'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
          <div className="mb-6 flex items-center gap-4">
            <ArtistAvatar name={currentArtist.stageName} size={64} verified={currentArtist.verified} />
            <div>
              <Button variant="secondary" size="sm">Alterar fotografia</Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nome artístico" defaultValue={currentArtist.stageName} />
            <Input label="Nome completo" defaultValue={currentArtist.fullName} />
            <Input label="Localização" defaultValue={currentArtist.location} />
            <Input label="Nome de utilizador" defaultValue={currentArtist.handle} />
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-bone-300">Biografia</span>
            <textarea
              defaultValue={currentArtist.bio}
              rows={4}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm text-bone-100 focus:border-brass-500 focus:outline-none"
            />
          </label>

          <div className="mt-6 flex justify-end">
            <Button>Guardar alterações</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
