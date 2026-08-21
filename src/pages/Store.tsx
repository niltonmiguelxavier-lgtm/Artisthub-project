import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { db, collection, getDocs, setDoc, doc, query, where } from '../lib/firebase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import EmailVerificationPromptModal from '../components/EmailVerificationPromptModal';
import { ShoppingBag, Music2, Disc, Shirt, Plus, Play, Pause, Download, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Product, ProductCategory } from '../types';
import { formatCurrency } from '../utils/format';

const sampleProducts: Product[] = [
  {
    id: 'prod-01',
    artistId: 'artist-001',
    artistName: 'Nélio Kaya',
    title: 'Afro-Soul Vibes Beat (Lease Exclusivo)',
    description: 'Instrumental completo pronto para gravação em estúdio com faixas WAV separadas (stems).',
    category: 'beats',
    price: 2500, // 2500 MT
    coverUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    previewAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    digitalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isAvailable: true,
  },
  {
    id: 'prod-02',
    artistId: 'artist-001',
    artistName: 'Nélio Kaya',
    title: 'Marrabenta Fusion Trap Beat',
    description: 'Fusão energética entre Marrabenta acústica moçambicana e 808s modernos.',
    category: 'beats',
    price: 1800,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    previewAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    digitalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    isAvailable: true,
  },
  {
    id: 'prod-03',
    artistId: 'artist-001',
    artistName: 'Nélio Kaya',
    title: 'Noite de Verão (Faixa Exclusiva Demo VIP)',
    description: 'Versão acústica exclusiva nunca lançada no Spotify, gravada ao vivo no estúdio.',
    category: 'exclusive_tracks',
    price: 450,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    previewAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    digitalFileUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isAvailable: true,
  },
  {
    id: 'prod-04',
    artistId: 'artist-001',
    artistName: 'Nélio Kaya',
    title: 'Camisola Oficial ArtistHub — Edição Limitada',
    description: 'Algodão 100% orgânico com bordado minimalista na frente e costas.',
    category: 'merchandise',
    price: 1500,
    coverUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    isAvailable: true,
  },
];

export default function Store() {
  const { user, artistProfile } = useAuth();
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVerifyPromptOpen, setIsVerifyPromptOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New product form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('beats');
  const [newPrice, setNewPrice] = useState('1500');
  const [newCover, setNewCover] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const artistId = artistProfile?.id || user?.uid || 'artist-001';
  const commissionRate = 0.12; // 12% platform fee
  const isEmailVerified = !user || user.emailVerified;

  const handleOpenAddProduct = () => {
    if (!isEmailVerified) {
      setIsVerifyPromptOpen(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const pSnap = await getDocs(collection(db, 'products'));
        if (!pSnap.empty) {
          const prods = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          setProducts(prods);
        } else {
          setProducts(sampleProducts);
        }
      } catch (e) {
        setProducts(sampleProducts);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const pId = 'prod-' + Date.now();
    const p: Product = {
      id: pId,
      artistId,
      artistName: artistProfile?.stageName || 'Artista',
      title: newTitle,
      description: newDesc,
      category: newCategory,
      price: Number(newPrice) || 1000,
      coverUrl: newCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      previewAudioUrl: newCategory !== 'merchandise' ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' : undefined,
      digitalFileUrl: newCategory !== 'merchandise' ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' : undefined,
      isAvailable: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'products', pId), p);
    } catch (e) {}

    setProducts((prev) => [p, ...prev]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleCheckout = async (product: Product) => {
    try {
      setCheckoutLoading(product.id);
      const res = await fetch('/api/create-product-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          category: product.category,
          artistId: product.artistId,
          buyerEmail: user?.email,
          successUrl: `${window.location.origin}/store/success`,
          cancelUrl: `${window.location.origin}/store`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.simulated) {
        // Direct redirect to success in development mode
        window.location.href = `/store/success?orderId=${data.downloadToken}&productId=${product.id}&title=${encodeURIComponent(
          product.title
        )}&price=${product.price}&category=${product.category}&artistId=${product.artistId}`;
      }
    } catch (err) {
      console.error(err);
      alert('Não foi possível iniciar o checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-bone-100">Loja Digital & Merchandise</h1>
          <p className="mt-1 text-sm text-bone-400">
            Vende beats com prévia de 30 segundos, faixas exclusivas e merchandise com pagamentos via Stripe.
          </p>
        </div>

        <Button
          id="create-product-btn"
          variant="primary"
          onClick={handleOpenAddProduct}
          className="gap-2"
        >
          <Plus size={16} />
          Adicionar Produto / Beat
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Todos os produtos' },
          { id: 'beats', label: 'Beats & Produções' },
          { id: 'exclusive_tracks', label: 'Faixas Exclusivas' },
          { id: 'merchandise', label: 'Merchandise & Roupas' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'border-cobalt-500 bg-cobalt-500/10 text-cobalt-400'
                : 'border-ink-700 text-bone-400 hover:text-bone-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Nenhum produto nesta categoria"
          description="Adiciona o teu primeiro beat, faixa exclusiva ou artigo de merchandise."
          actionLabel="Adicionar produto"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const isPlayingThis = currentTrack?.id === product.id && isPlaying;
            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 transition-all hover:border-ink-700"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-950">
                    <img
                      src={product.coverUrl}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-ink-950/80 px-2.5 py-1 text-xs font-semibold text-bone-100 backdrop-blur">
                        {product.category === 'beats'
                          ? 'Beat'
                          : product.category === 'exclusive_tracks'
                          ? 'Faixa Exclusiva'
                          : 'Merch'}
                      </span>
                    </div>

                    {product.previewAudioUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          playTrack({
                            id: product.id,
                            title: product.title,
                            artistName: product.artistName || 'ArtistHub',
                            audioUrl: product.previewAudioUrl!,
                            coverUrl: product.coverUrl,
                            isPreview: true,
                          })
                        }
                        className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-cobalt-500 px-3.5 py-2 text-xs font-medium text-bone-100 shadow-lg backdrop-blur transition-transform active:scale-95 hover:bg-cobalt-400"
                      >
                        {isPlayingThis ? <Pause size={14} /> : <Play size={14} />}
                        {isPlayingThis ? 'Pausar Prévia (30s)' : 'Ouvir Prévia (30s)'}
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-display text-base text-bone-100 line-clamp-1">{product.title}</h3>
                    <p className="mt-1 text-xs text-bone-400 line-clamp-2">{product.description}</p>
                  </div>
                </div>

                <div className="border-t border-ink-800 p-5 flex items-center justify-between bg-ink-950/40">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-bone-400">Preço</span>
                    <p className="font-mono-data text-base font-semibold text-teal-400">
                      {formatCurrency(product.price)}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCheckout(product)}
                    disabled={checkoutLoading === product.id}
                  >
                    {checkoutLoading === product.id ? 'A processar...' : 'Comprar Agora'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Product */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Produto / Beat">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            id="prod-title"
            label="Título do Artigo *"
            placeholder="Ex: Afrobeat Club Banger (Instrumental)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Categoria</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            >
              <option value="beats">Beat / Instrumental</option>
              <option value="exclusive_tracks">Faixa Exclusiva / Acústico</option>
              <option value="merchandise">Merchandise / Vestuário</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="prod-price"
              label="Preço (MT) *"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
            <Input
              id="prod-cover"
              label="URL da Imagem / Capa"
              placeholder="https://..."
              value={newCover}
              onChange={(e) => setNewCover(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-bone-300">Descrição Detalhada</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Inclui detalhes sobre os direitos incluídos, formato do ficheiro (WAV/MP3) ou tamanhos de roupa."
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-bone-100 focus:border-cobalt-500 focus:outline-none"
            />
          </div>

          <div className="rounded-xl border border-ink-800 bg-ink-950 p-3 text-xs text-bone-400">
            💡 <strong className="text-bone-200">Comissão da Plataforma (12%):</strong> Sobre uma venda de{' '}
            {formatCurrency(Number(newPrice) || 0)}, receberás {formatCurrency((Number(newPrice) || 0) * 0.88)} limpos no teu saldo.
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Publicar Artigo
            </Button>
          </div>
        </form>
      </Modal>

      <EmailVerificationPromptModal
        isOpen={isVerifyPromptOpen}
        onClose={() => setIsVerifyPromptOpen(false)}
        actionName="publicar beats e produtos na loja"
      />
    </div>
  );
}
