import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ImageUpload from '../components/ui/ImageUpload';
import Badge from '../components/ui/Badge';
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Crown,
  Zap,
  Smartphone,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import ZumboPayModal from '../components/payment/ZumboPayModal';
import { getZumboPayConfig, type ZumboPayConfig } from '../services/zumbopayService';

const tabs = [
  { id: 'profile', label: 'Perfil de Artista', icon: User },
  { id: 'subscription', label: 'Plano & Subscrição PRO', icon: Crown },
  { id: 'zumbopay', label: 'ZumboPay & Pagamentos', icon: CreditCard },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança & Conta', icon: Shield },
];

export default function Settings() {
  const { artistProfile, user, updateArtistProfile, refreshArtistProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Form states
  const [stageName, setStageName] = useState(artistProfile?.stageName || '');
  const [fullName, setFullName] = useState(artistProfile?.fullName || '');
  const [handle, setHandle] = useState(artistProfile?.handle || '');
  const [bio, setBio] = useState(artistProfile?.bio || '');
  const [location, setLocation] = useState(artistProfile?.location || '');
  const [genres, setGenres] = useState(artistProfile?.genres?.join(', ') || '');
  const [avatarUrl, setAvatarUrl] = useState(artistProfile?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(artistProfile?.coverUrl || '');
  const [instagram, setInstagram] = useState(artistProfile?.socials?.instagram || '');
  const [youtube, setYoutube] = useState(artistProfile?.socials?.youtube || '');
  const [tiktok, setTiktok] = useState(artistProfile?.socials?.tiktok || '');
  const [spotify, setSpotify] = useState(artistProfile?.socials?.spotify || '');

  const isPro = artistProfile?.subscriptionTier === 'pro';

  // ZumboPay & PRO state
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [zumboConfig, setZumboConfig] = useState<ZumboPayConfig | null>(null);
  const [validatingZumbo, setValidatingZumbo] = useState(false);
  const [zumboValidateMsg, setZumboValidateMsg] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<'mpesa' | 'emola'>((artistProfile as any)?.payoutMethod || 'mpesa');
  const [payoutPhone, setPayoutPhone] = useState((artistProfile as any)?.payoutPhone || '');
  const [payoutSaveSuccess, setPayoutSaveSuccess] = useState(false);

  React.useEffect(() => {
    getZumboPayConfig().then(setZumboConfig).catch(console.warn);
  }, []);

  const handleTestZumboPay = async () => {
    try {
      setValidatingZumbo(true);
      setZumboValidateMsg(null);
      const res = await fetch('/api/zumbopay/validate');
      const data = await res.json();
      if (data.valid) {
        setZumboValidateMsg(`✅ Conexão OK! Gateway operacional (${data.live ? 'Modo Produção' : 'Modo Simulado/Sandbox'}).`);
      } else {
        setZumboValidateMsg(`⚠️ ${data.message || 'Chaves em falta ou inválidas.'}`);
      }
    } catch (e: any) {
      setZumboValidateMsg(`❌ Erro de ligação: ${e.message}`);
    } finally {
      setValidatingZumbo(false);
    }
  };

  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setPayoutSaveSuccess(false);
      await updateArtistProfile({
        ...((artistProfile as any) || {}),
        payoutMethod,
        payoutPhone,
      });
      setPayoutSaveSuccess(true);
      setTimeout(() => setPayoutSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar dados de levantamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleProZumboSuccess = async (paymentInfo: { reference: string; channel: string }) => {
    try {
      await updateArtistProfile({
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        verified: true,
      });
      setIsProModalOpen(false);
      alert(`🎉 Plano ArtistHub PRO ativado via ${paymentInfo.channel.toUpperCase()}! Selo de verificação e uploads ilimitados desbloqueados.`);
    } catch (e) {
      console.error(e);
      alert('Subscrição confirmada! Atualize a página para ver o novo estado.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      await updateArtistProfile({
        stageName,
        fullName,
        handle: handle.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        bio,
        location,
        genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        avatarUrl: avatarUrl || undefined,
        coverUrl: coverUrl || undefined,
        socials: {
          instagram: instagram || undefined,
          youtube: youtube || undefined,
          tiktok: tiktok || undefined,
          spotify: spotify || undefined,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar alterações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribePro = async (planType: 'monthly' | 'annual') => {
    try {
      setCheckoutLoading(true);
      const res = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: artistProfile?.id || user?.uid,
          planType,
          successUrl: `${window.location.origin}/settings`,
          cancelUrl: `${window.location.origin}/settings`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.simulated) {
        // Upgrade directly in context for simulation
        await updateArtistProfile({
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          verified: true,
        });
        alert('🎉 Plano ArtistHub PRO ativado com sucesso! Selo de verificação e uploads ilimitados desbloqueados.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao iniciar processo de subscrição.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (confirm('Tens a certeza que pretendes cancelar o teu plano PRO? O teu selo de verificação será desativado no fim do ciclo.')) {
      await updateArtistProfile({
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
        verified: false,
      });
      alert('Plano alterado para Gratuito.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-bone-100">Definições & Perfil</h1>
        <p className="mt-1 text-sm text-bone-400">
          Gere os detalhes do teu perfil público, subscrição PRO e preferências de conta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation */}
        <div className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                activeTab === id
                  ? 'bg-ink-800 text-cobalt-400 font-medium'
                  : 'text-bone-300 hover:bg-ink-800/60'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 rounded-2xl border border-ink-800 bg-ink-900 p-6">
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="font-display text-lg text-bone-100">Perfil Público de Artista</h2>
                  <p className="text-xs text-bone-400">Estas informações são apresentadas na tua página pública.</p>
                </div>
                {isPro && (
                  <Badge tone="cobalt">
                    <Crown size={12} className="mr-1 inline" /> PRO Ativo
                  </Badge>
                )}
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-teal-400">
                  <CheckCircle2 size={16} />
                  Perfil atualizado com sucesso!
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="stage-name"
                  label="Nome Artístico *"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  required
                />
                <Input
                  id="full-name"
                  label="Nome Completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="artist-handle"
                  label="Handle do Perfil (/artist/:handle) *"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                />
                <Input
                  id="artist-location"
                  label="Localização / Cidade"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-bone-300">Biografia Artística</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
                  placeholder="Conta a tua história, géneros musicais e trajetória aos fãs e produtores."
                />
              </div>

              <Input
                id="artist-genres"
                label="Géneros Musicais (separados por vírgula)"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Afrobeat, Marrabenta, R&B"
              />

              <div className="grid gap-5 sm:grid-cols-2 pt-2">
                <ImageUpload
                  id="artist-avatar-upload"
                  label="Foto de Perfil do Artista"
                  value={avatarUrl}
                  onChange={(url) => setAvatarUrl(url)}
                  storagePath={artistProfile?.id || user?.uid ? `artists/${artistProfile?.id || user?.uid}/avatar.webp` : undefined}
                  aspectRatio="square"
                  helperText="Upload direto para /artists/{id}/avatar.webp (JPG/PNG/WEBP máx. 5MB)"
                />
                <ImageUpload
                  id="artist-cover-upload"
                  label="Capa de Fundo do Perfil"
                  value={coverUrl}
                  onChange={(url) => setCoverUrl(url)}
                  storagePath={artistProfile?.id || user?.uid ? `artists/${artistProfile?.id || user?.uid}/cover.webp` : undefined}
                  aspectRatio="banner"
                  helperText="Upload direto para /artists/{id}/cover.webp (Banner 3:1)"
                />
              </div>

              {/* Social Links */}
              <div className="border-t border-ink-800 pt-4 space-y-4">
                <h3 className="text-xs font-semibold text-bone-200 uppercase tracking-wider">Redes Sociais & Streaming</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="social-ig"
                    label="Instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                  <Input
                    id="social-yt"
                    label="Canal do YouTube"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@..."
                  />
                  <Input
                    id="social-tt"
                    label="TikTok"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@..."
                  />
                  <Input
                    id="social-sp"
                    label="Perfil Spotify"
                    value={spotify}
                    onChange={(e) => setSpotify(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-ink-800">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'A guardar...' : 'Guardar Alterações'}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6 rounded-2xl border border-ink-800 bg-ink-900 p-6">
              <div className="flex items-center justify-between border-b border-ink-800 pb-4">
                <div>
                  <h2 className="font-display text-lg text-bone-100">Subscrição & Monetização</h2>
                  <p className="text-xs text-bone-400">Escolhe o plano ideal para alavancar a tua carreira musical.</p>
                </div>
                <Badge tone={isPro ? 'cobalt' : 'neutral'}>
                  Plano Atual: {isPro ? 'PRO' : 'Gratuito'}
                </Badge>
              </div>

              {/* Plans Comparison */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Free Plan */}
                <div className={`rounded-2xl border p-6 flex flex-col justify-between ${
                  !isPro ? 'border-ink-700 bg-ink-950/60' : 'border-ink-800 bg-ink-950/20'
                }`}>
                  <div>
                    <h3 className="font-display text-base text-bone-100">Plano Gratuito</h3>
                    <p className="mt-1 text-xs text-bone-400">Para artistas que estão a dar os primeiros passos.</p>
                    <p className="mt-4 font-mono-data text-2xl font-bold text-bone-100">0 MT / mês</p>

                    <ul className="mt-6 space-y-3 text-xs text-bone-300">
                      <li className="flex items-center gap-2">✓ Até 5 faixas musicais</li>
                      <li className="flex items-center gap-2">✓ Perfil público básico</li>
                      <li className="flex items-center gap-2">✓ Candidatura a oportunidades standard</li>
                      <li className="flex items-center gap-2">✓ Loja digital com comissão standard</li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-ink-800">
                    {!isPro ? (
                      <span className="block text-center text-xs font-semibold text-bone-400">Plano Atual</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="w-full justify-center" onClick={handleDowngrade}>
                        Mudar para Gratuito
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pro Plan */}
                <div className={`relative rounded-2xl border p-6 flex flex-col justify-between ${
                  isPro
                    ? 'border-cobalt-500 bg-cobalt-500/10 shadow-panel'
                    : 'border-cobalt-500/40 bg-ink-950/80 shadow-lg'
                }`}>
                  <div className="absolute -top-3 right-4 rounded-full bg-cobalt-500 px-3 py-0.5 text-[10px] font-bold text-ink-950 uppercase tracking-wider">
                    Recomendado
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-cobalt-400">
                      <Crown size={18} />
                      <h3 className="font-display text-base text-bone-100">ArtistHub PRO</h3>
                    </div>
                    <p className="mt-1 text-xs text-bone-400">Para músicos profissionais e em crescimento acelerado.</p>
                    <p className="mt-4 font-mono-data text-2xl font-bold text-teal-400">
                      650 MT <span className="text-xs font-normal text-bone-400">/ mês</span>
                    </p>

                    <ul className="mt-6 space-y-3 text-xs text-bone-200">
                      <li className="flex items-center gap-2 text-teal-400">✓ <strong>Uploads ilimitados de faixas</strong></li>
                      <li className="flex items-center gap-2">✓ <strong>Selo de Verificado Oficial</strong> no perfil</li>
                      <li className="flex items-center gap-2">✓ <strong>Destaque no topo</strong> para contratantes e marcas</li>
                      <li className="flex items-center gap-2">✓ Estatísticas avançadas de audiência e países</li>
                      <li className="flex items-center gap-2">✓ Acesso antecipado a festivais e concursos</li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-ink-800 space-y-2">
                    {isPro ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-medium text-teal-400 py-2">
                        <CheckCircle2 size={16} /> Subscrição PRO Ativa
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          className="w-full justify-center gap-2 py-3 shadow-glow-sm"
                          onClick={() => setIsProModalOpen(true)}
                        >
                          <Smartphone size={16} className="text-teal-300" />
                          Subscrever com M-Pesa / e-Mola (ZumboPay)
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-full justify-center gap-2 py-2 text-xs text-bone-300"
                          onClick={() => handleSubscribePro('monthly')}
                          disabled={checkoutLoading}
                        >
                          <CreditCard size={14} />
                          {checkoutLoading ? 'A conectar...' : 'Pagar via Cartão / Stripe'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'zumbopay' && (
            <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-800 pb-5">
                <div>
                  <h2 className="font-display text-lg text-bone-100 flex items-center gap-2">
                    <CreditCard className="text-teal-400" size={20} />
                    ZumboPay Payment Gateway
                  </h2>
                  <p className="text-xs text-bone-400 mt-1">
                    Gateway oficial para pagamentos móveis em Moçambique (M-Pesa Vodacom e e-Mola Movitel) e cartões bancários MPGS.
                  </p>
                </div>
                <Badge tone={zumboConfig?.isLive ? 'success' : 'progress'}>
                  {zumboConfig?.isLive ? 'Live / Produção' : 'Simulação / Sandbox Ativo'}
                </Badge>
              </div>

              {/* Canal Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-bone-200">M-Pesa (Vodacom)</span>
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  </div>
                  <p className="text-[11px] text-bone-400">Prefixo: 84 / 85. STK Push instantâneo com PIN no telemóvel.</p>
                  <div className="text-[10px] text-teal-400 font-mono">Status: Ativo</div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-bone-200">e-Mola (Movitel)</span>
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  </div>
                  <p className="text-[11px] text-bone-400">Prefixo: 86 / 87. Notificação USSD direta para confirmação.</p>
                  <div className="text-[10px] text-teal-400 font-mono">Status: Ativo</div>
                </div>

                <div className="rounded-xl border border-cobalt-500/20 bg-cobalt-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-bone-200">Cartão Bancário</span>
                    <span className="h-2 w-2 rounded-full bg-cobalt-500"></span>
                  </div>
                  <p className="text-[11px] text-bone-400">Mastercard / Visa via hosted checkout com 3D-Secure 2.0.</p>
                  <div className="text-[10px] text-teal-400 font-mono">Status: Ativo</div>
                </div>
              </div>

              {/* Connection Test */}
              <div className="rounded-xl border border-ink-800 bg-ink-950 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-bone-200">Diagnóstico da API ZumboPay</h3>
                    <p className="text-[11px] text-bone-400">
                      Verifica a conectividade e autenticação com o endpoint v1.3.1.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestZumboPay}
                    disabled={validatingZumbo}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw size={14} className={validatingZumbo ? 'animate-spin' : ''} />
                    {validatingZumbo ? 'A testar...' : 'Testar Conexão API'}
                  </Button>
                </div>
                {zumboValidateMsg && (
                  <div className="rounded-lg bg-ink-900 border border-ink-800 p-2.5 text-xs text-bone-200">
                    {zumboValidateMsg}
                  </div>
                )}
              </div>

              {/* Default Payout Phone Setting */}
              <form onSubmit={handleSavePayoutSettings} className="rounded-xl border border-ink-800 bg-ink-950 p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-bone-100">Configuração de Levantamento para Artista</h3>
                  <p className="text-[11px] text-bone-400 mt-0.5">
                    Define o teu telemóvel padrão para receber pagamentos de vendas de beats, merch e royalties diretamente via ZumboPay Payout.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-bone-300 mb-1">Carteira Móvel Preferida</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value as 'mpesa' | 'emola')}
                      className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-bone-100 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="mpesa">M-Pesa (Vodacom 84/85)</option>
                      <option value="emola">e-Mola (Movitel 86/87)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-bone-300 mb-1">Número de Telemóvel (+258)</label>
                    <input
                      type="tel"
                      maxLength={9}
                      placeholder={payoutMethod === 'mpesa' ? '84 123 4567' : '86 123 4567'}
                      value={payoutPhone}
                      onChange={(e) => setPayoutPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm font-mono text-bone-100 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {payoutSaveSuccess && (
                  <div className="flex items-center gap-2 text-xs text-teal-400">
                    <CheckCircle2 size={14} /> Dados de levantamento guardados com sucesso!
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={saving}>
                    {saving ? 'A guardar...' : 'Guardar Dados de Pagamento'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6 space-y-4">
              <h2 className="font-display text-lg text-bone-100">Preferências de Notificação</h2>
              <p className="text-xs text-bone-400">Configura como queres ser notificado sobre vendas e oportunidades.</p>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 text-xs text-bone-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-ink-700 bg-ink-950 text-cobalt-500" />
                  Notificar quando uma venda for concluída na loja
                </label>
                <label className="flex items-center gap-3 text-xs text-bone-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-ink-700 bg-ink-950 text-cobalt-500" />
                  Alertar sobre novas oportunidades e festivais abertos
                </label>
                <label className="flex items-center gap-3 text-xs text-bone-200 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-ink-700 bg-ink-950 text-cobalt-500" />
                  Resumo semanal de métricas de fãs e reproduções
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-2xl border border-ink-800 bg-ink-900 p-6 space-y-4">
              <h2 className="font-display text-lg text-bone-100">Segurança da Conta</h2>
              <div className="rounded-xl border border-ink-800 bg-ink-950 p-4 text-xs text-bone-300">
                <p>Email associado: <strong className="text-bone-100">{user?.email || 'artista@artisthub.app'}</strong></p>
                <p className="mt-1">Estado de verificação: {user?.emailVerified ? '✅ Verificado' : '⏳ Pendente de confirmação'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal ZumboPay para Subscrição PRO */}
      <ZumboPayModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        title="Subscrição Mensal ArtistHub PRO"
        amount={650}
        currency="MZN"
        orderType="pro_subscription"
        orderId={`sub_pro_${Date.now()}`}
        metadata={{
          artistId: artistProfile?.id || user?.uid,
          plan: 'monthly',
        }}
        onSuccess={handleProZumboSuccess}
        onStripeFallback={() => {
          setIsProModalOpen(false);
          handleSubscribePro('monthly');
        }}
      />
    </div>
  );
}
