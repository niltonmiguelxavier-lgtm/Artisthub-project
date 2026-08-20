import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Users, Wallet, Music2, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import { careerIndicators } from '../data/career';

const problems = [
  'Tenho música, mas ninguém conhece.',
  'Não sei como promover os meus lançamentos.',
  'Não sei quanto estou a ganhar.',
  'Tenho tudo espalhado por várias plataformas.',
  'Tenho dificuldade em encontrar oportunidades.',
  'Não sei como organizar a minha carreira.',
];

const pillars = [
  { icon: Music2, label: 'Música', description: 'Organiza lançamentos e acompanha o desempenho de cada faixa.' },
  { icon: TrendingUp, label: 'Crescimento', description: 'Vê a tua carreira evoluir com indicadores claros.' },
  { icon: Wallet, label: 'Monetização', description: 'Royalties, vendas e apoio de fãs, tudo num só lugar.' },
  { icon: Compass, label: 'Oportunidades', description: 'Shows, festivais e colaborações à tua medida.' },
  { icon: Users, label: 'Base de fãs', description: 'Constrói e entende a tua audiência ao longo do tempo.' },
];

export default function Landing() {
  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-block rounded-full border border-ink-700 px-3 py-1 text-xs text-bone-400">
              Feito para artistas africanos e internacionais
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.08] text-bone-100 sm:text-5xl lg:text-6xl">
              Transforma o teu talento numa carreira.
            </h1>
            <p className="mt-5 max-w-lg text-base text-bone-300 sm:text-lg">
              O ArtistHub ajuda artistas a organizar, promover e monetizar a sua carreira num único lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button size="lg" icon={<ArrowRight size={17} />} iconPosition="right">
                  Começar agora
                </Button>
              </Link>
              <Link to="/artist/nelio-kaya">
                <Button size="lg" variant="secondary">
                  Explorar artistas
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature dashboard preview — waveform meters, not a generic gradient card */}
          <div className="rounded-2xl border border-ink-800 bg-ink-900 p-5 shadow-2xl">
            <p className="mb-4 font-display text-sm text-bone-400">Estado da tua carreira</p>
            <div className="space-y-4">
              {careerIndicators.slice(0, 3).map((ind) => {
                const filled = Math.round((ind.value / 100) * 18);
                return (
                  <div key={ind.id}>
                    <div className="mb-1.5 flex justify-between text-xs text-bone-300">
                      <span>{ind.label}</span>
                      <span className="font-mono-data text-brass-400">{ind.value}%</span>
                    </div>
                    <div className="waveform" style={{ height: 20 }}>
                      {Array.from({ length: 18 }, (_, i) => (
                        <div
                          key={i}
                          className="waveform-bar"
                          data-filled={i < filled}
                          style={{ height: `${30 + ((i * 17) % 70)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-800 pt-5">
              <div>
                <p className="font-mono-data text-xl text-bone-100">284.6k</p>
                <p className="text-xs text-bone-400">streams</p>
              </div>
              <div>
                <p className="font-mono-data text-xl text-teal-400">24.850 MT</p>
                <p className="text-xs text-bone-400">receitas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="border-t border-ink-800 bg-ink-900/40 px-5 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-xl font-display text-3xl text-bone-100 sm:text-4xl">
            Reconheces alguma destas frases?
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {problems.map((p) => (
              <div key={p} className="rounded-2xl border border-ink-800 bg-ink-900 p-5">
                <p className="text-sm text-bone-300">"{p}"</p>
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-brass-500/30 bg-brass-500/5 p-8 text-center">
            <p className="font-display text-2xl text-brass-400 sm:text-3xl">
              O ArtistHub organiza tudo num só lugar.
            </p>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="px-5 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl text-bone-100 sm:text-4xl">Um centro de carreira, não só streaming.</h2>
          <p className="mt-3 max-w-xl text-bone-400">
            Da primeira música ao estatuto profissional — o ArtistHub acompanha cada etapa.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pillars.map(({ icon: Icon, label, description }) => (
              <div key={label} className="rounded-2xl border border-ink-800 bg-ink-900 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-brass-400">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-display text-base text-bone-100">{label}</p>
                <p className="mt-1.5 text-sm text-bone-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 to-ink-850 px-6 py-14 text-center">
          <h2 className="max-w-xl font-display text-3xl text-bone-100 sm:text-4xl">
            A tua carreira merece um plano, não apenas lançamentos.
          </h2>
          <Link to="/dashboard" className="mt-7">
            <Button size="lg" icon={<ArrowRight size={17} />} iconPosition="right">
              Começar agora, é gratuito
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
