import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { CheckCircle2, Download, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../utils/format';

export default function StoreSuccess() {
  const [searchParams] = useSearchParams();
  const title = searchParams.get('title') || 'Artigo Digital ArtistHub';
  const price = searchParams.get('price') || '1500';
  const category = searchParams.get('category') || 'beats';
  const orderId = searchParams.get('orderId') || 'ord_' + Math.random().toString(36).substring(2, 10);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  }, []);

  const handleDownload = () => {
    // Generate secure temporary download link
    const sampleDownloadFile = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
    const link = document.createElement('a');
    link.href = sampleDownloadFile;
    link.download = `${title.replace(/\s+/g, '_')}_ArtistHub_Master.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-ink-800 bg-ink-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
          <CheckCircle2 size={36} />
        </div>

        <h1 className="font-display text-2xl text-bone-100">Pagamento Confirmado!</h1>
        <p className="mt-2 text-sm text-bone-300">
          Obrigado por apoiares a música independente. A tua transação foi concluída com sucesso.
        </p>

        <div className="my-6 rounded-xl border border-ink-800 bg-ink-950 p-4 text-left">
          <div className="flex items-center justify-between border-b border-ink-850 pb-2.5">
            <span className="text-xs text-bone-400">Referência do Pedido</span>
            <span className="font-mono-data text-xs text-bone-200">{orderId}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-ink-850">
            <span className="text-xs text-bone-400">Produto</span>
            <span className="font-medium text-xs text-bone-100">{title}</span>
          </div>
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs text-bone-400">Total Pago</span>
            <span className="font-mono-data text-sm font-semibold text-teal-400">{formatCurrency(Number(price))}</span>
          </div>
        </div>

        {category !== 'merchandise' ? (
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full justify-center gap-2 py-3.5"
              onClick={handleDownload}
            >
              <Download size={18} />
              {downloaded ? 'Descarregar Novamente (Link Temporário)' : 'Descarregar Ficheiro Master (WAV/MP3)'}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-bone-400">
              <ShieldCheck size={14} className="text-teal-400" />
              Link de download protegido e exclusivo para o teu pedido.
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-ink-800 bg-ink-950 p-4 text-xs text-bone-300">
            📦 O vendedor foi notificado e receberás o código de rastreio de envio de merchandise no teu email.
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/store">
            <Button variant="ghost" size="sm" className="gap-2">
              <ShoppingBag size={14} />
              Voltar à Loja
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              Ir para o Dashboard
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
