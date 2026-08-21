import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from '../lib/firebase';
import OpportunityCard from '../components/cards/OpportunityCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import EmailVerificationPromptModal from '../components/EmailVerificationPromptModal';
import { Briefcase, Plus, CheckCircle2, Sparkles, Star, Building2, AlertCircle } from 'lucide-react';
import type { Opportunity, OpportunityCategory, OpportunityApplication } from '../types';
import { opportunities as defaultOpportunities } from '../data/opportunities';

const filterCategories: { label: string; value: OpportunityCategory | 'todas' }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Shows', value: 'show' },
  { label: 'Festivais', value: 'festival' },
  { label: 'Concursos', value: 'concurso' },
  { label: 'Colaborações', value: 'colaboracao' },
  { label: 'Marcas', value: 'marca' },
  { label: 'Produtores', value: 'produtor' },
];

export default function Opportunities() {
  const { user, userProfile, artistProfile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeCategory, setActiveCategory] = useState<OpportunityCategory | 'todas'>('todas');
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVerifyPromptOpen, setIsVerifyPromptOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New opportunity form
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState<OpportunityCategory>('show');
  const [location, setLocation] = useState('Maputo, Moçambique');
  const [date, setDate] = useState('Outubro 2026');
  const [deadline, setDeadline] = useState('30 Setembro 2026');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const isOrganizer = userProfile?.role === 'organizer';
  const isPro = artistProfile?.subscriptionTier === 'pro';
  const isEmailVerified = !user || user.emailVerified;

  const handleOpenCreateOpportunity = () => {
    if (!isEmailVerified) {
      setIsVerifyPromptOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    const loadOps = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'opportunities'));
        if (!snap.empty) {
          const ops = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Opportunity));
          setOpportunities(ops);
        } else {
          setOpportunities(defaultOpportunities);
        }

        // Load applications made by current artist
        if (artistProfile?.id) {
          const appSnap = await getDocs(collection(db, 'applications'));
          const myApps = appSnap.docs
            .map((d) => d.data() as OpportunityApplication)
            .filter((a) => a.artistId === artistProfile.id)
            .map((a) => a.opportunityId);
          setAppliedIds(myApps);
        }
      } catch (e) {
        setOpportunities(defaultOpportunities);
      } finally {
        setLoading(false);
      }
    };
    loadOps();
  }, [artistProfile?.id]);

  const handleApply = async (opp: Opportunity) => {
    if (!artistProfile) {
      alert('Por favor completa o teu perfil de artista para te candidatares.');
      return;
    }

    try {
      setApplyingId(opp.id);
      const appId = `app_${opp.id}_${artistProfile.id}`;
      const appData: OpportunityApplication = {
        id: appId,
        opportunityId: opp.id,
        artistId: artistProfile.id,
        artistName: artistProfile.stageName,
        artistHandle: artistProfile.handle,
        appliedAt: new Date().toISOString(),
        status: 'pendente',
        notes: isPro ? '⭐ Artista Verificado ArtistHub PRO (Prioridade)' : undefined,
      };

      await setDoc(doc(db, 'applications', appId), appData);
      setAppliedIds((prev) => [...prev, opp.id]);
    } catch (err) {
      console.warn('Persist application failed, updating local state:', err);
      setAppliedIds((prev) => [...prev, opp.id]);
    } finally {
      setApplyingId(null);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const opId = 'opp-' + Date.now();
    const newOp: Opportunity = {
      id: opId,
      organizerId: user?.uid,
      title,
      organization: organization || userProfile?.displayName || 'Organizador',
      category,
      location,
      date,
      deadline,
      description,
      isFeatured,
      status: 'aberta',
      applicantsCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'opportunities', opId), newOp);
    } catch (e) {}

    setOpportunities((prev) => [newOp, ...prev]);
    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const filteredOpportunities = opportunities.filter((op) => {
    if (activeCategory === 'todas') return true;
    return op.category === activeCategory;
  });

  // Sort featured opportunities first
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-bone-100">Oportunidades & Concursos</h1>
          <p className="mt-1 text-sm text-bone-400">
            Candidata-te a festivais, marcas e colaborações com um clique no teu perfil.
          </p>
        </div>

        {isOrganizer && (
          <Button
            id="create-opportunity-btn"
            variant="primary"
            onClick={handleOpenCreateOpportunity}
            className="gap-2"
          >
            <Plus size={16} />
            Publicar Oportunidade
          </Button>
        )}
      </div>

      {/* Pro highlight banner */}
      {isPro && (
        <div className="flex items-center gap-3 rounded-2xl border border-cobalt-500/30 bg-cobalt-500/10 p-4 text-sm text-cobalt-200">
          <Sparkles size={18} className="text-cobalt-400 shrink-0" />
          <span>
            <strong>Vantagem PRO Ativa:</strong> O teu perfil e candidaturas aparecem no topo para organizadores com o selo de verificação.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterCategories.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveCategory(f.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === f.value
                ? 'border-cobalt-500 bg-cobalt-500/10 text-cobalt-400'
                : 'border-ink-700 text-bone-400 hover:text-bone-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {sortedOpportunities.length === 0 ? (
        <EmptyState
          title="Nenhuma oportunidade encontrada"
          description="Volta mais tarde ou muda a categoria selecionada."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedOpportunities.map((opp) => {
            const hasApplied = appliedIds.includes(opp.id);
            return (
              <div
                key={opp.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-ink-900 p-5 transition-all ${
                  opp.isFeatured
                    ? 'border-cobalt-500/40 shadow-panel ring-1 ring-cobalt-500/20'
                    : 'border-ink-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone={opp.category === 'festival' || opp.category === 'show' ? 'cobalt' : 'neutral'}>
                          {opp.category}
                        </Badge>
                        {opp.isFeatured && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                            <Star size={12} fill="currentColor" />
                            Destaque
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2.5 font-display text-base text-bone-100">{opp.title}</h3>
                      <p className="mt-0.5 text-xs font-medium text-cobalt-400">{opp.organization}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-bone-300 line-clamp-3">{opp.description}</p>
                </div>

                <div className="mt-5 border-t border-ink-800 pt-4">
                  <div className="mb-3 flex items-center justify-between text-xs text-bone-400">
                    <span>📍 {opp.location}</span>
                    <span>📅 {opp.date}</span>
                  </div>

                  <Button
                    variant={hasApplied ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full justify-center gap-2"
                    onClick={() => handleApply(opp)}
                    disabled={hasApplied || applyingId === opp.id}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle2 size={14} className="text-teal-400" />
                        Candidatura Enviada
                      </>
                    ) : applyingId === opp.id ? (
                      'A enviar candidatura...'
                    ) : (
                      'Candidatar com 1 Clique'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create Opportunity (For Organizers) */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Publicar Nova Oportunidade">
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          <Input
            id="opp-title"
            label="Título da Oportunidade *"
            placeholder="Ex: Convocatória para Artistas — Festival Sol & Som"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="opp-org"
              label="Nome da Organização *"
              placeholder="Ex: Produtora Som do Sul"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-bone-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
              >
                <option value="show">Show</option>
                <option value="festival">Festival</option>
                <option value="concurso">Concurso</option>
                <option value="colaboracao">Colaboração</option>
                <option value="marca">Marca / Patrocínio</option>
                <option value="produtor">Produtor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="opp-location"
              label="Localização"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Input
              id="opp-date"
              label="Data do Evento"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Descrição & Requisitos</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica o que procuras no artista, cachet previsto, material necessário e condições."
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
              required
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-bone-200">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-ink-700 bg-ink-900 text-cobalt-500"
            />
            Destacar no topo da lista com selo de patrocinador
          </label>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Publicar Oportunidade
            </Button>
          </div>
        </form>
      </Modal>

      <EmailVerificationPromptModal
        isOpen={isVerifyPromptOpen}
        onClose={() => setIsVerifyPromptOpen(false)}
        actionName="publicar oportunidades e convocatórias"
      />
    </div>
  );
}
