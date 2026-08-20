import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Headphones, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import StatCard from '../components/cards/StatCard';
import ProgressCard from '../components/cards/ProgressCard';
import TaskCard from '../components/cards/TaskCard';
import ArtistHubAI from '../components/ArtistHubAI';
import Button from '../components/ui/Button';
import { currentArtist } from '../data/artists';
import { careerIndicators, nextActions } from '../data/career';
import { formatCompact, formatCurrency } from '../utils/format';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-bone-100 sm:text-3xl">Olá, {currentArtist.stageName.split(' ')[0]}.</h1>
        <p className="mt-1 text-sm text-bone-400">Aqui está o resumo da tua carreira esta semana.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Seguidores" value={formatCompact(currentArtist.followers)} icon={Users} trend={{ value: '+3,1% esta semana', positive: true }} />
        <StatCard label="Streams" value="284.6k" icon={Headphones} trend={{ value: '+9,7% este mês', positive: true }} />
        <StatCard label="Receitas" value={formatCurrency(24850)} icon={Wallet} trend={{ value: '+12% este mês', positive: true }} />
        <StatCard label="Crescimento" value="+18,4%" icon={TrendingUp} trend={{ value: 'vs. mês anterior', positive: true }} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-bone-100">Estado da tua carreira</h2>
          <Link to="/career">
            <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
              Ver diagnóstico completo
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {careerIndicators.map((ind) => (
            <ProgressCard key={ind.id} indicator={ind} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-bone-100">O que deves fazer agora</h2>
        <div className="space-y-3">
          {nextActions.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i + 1} />
          ))}
        </div>
      </section>

      <ArtistHubAI />
    </div>
  );
}
