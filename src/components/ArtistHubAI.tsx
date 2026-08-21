import React from 'react';
import { Sparkles, Send } from 'lucide-react';

const sampleQuestions = [
  'Como posso aumentar os meus streams?',
  'Qual é o meu maior problema neste momento?',
  'Que conteúdo devo publicar esta semana?',
];

// Visual placeholder only — no AI API is connected yet. This is the
// space reserved for the future ArtistHub AI assistant.
export default function ArtistHubAI() {
  return (
    <div className="rounded-2xl border border-cobalt-500/30 bg-gradient-to-br from-cobalt-500/5 to-transparent p-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={17} className="text-cobalt-400" />
        <h2 className="font-display text-lg text-bone-100">ArtistHub AI</h2>
        <span className="ml-1 rounded-full border border-ink-700 px-2 py-0.5 text-[10px] text-bone-400">Em breve</span>
      </div>
      <p className="mb-4 text-sm text-bone-400">
        O teu assistente de carreira vai responder a perguntas com base nos teus dados reais.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {sampleQuestions.map((q) => (
          <span key={q} className="rounded-full border border-ink-700 px-3 py-1.5 text-xs text-bone-400">
            {q}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-2.5">
        <input
          disabled
          placeholder="Pergunta alguma coisa sobre a tua carreira…"
          className="flex-1 bg-transparent text-sm text-bone-300 placeholder:text-bone-400 focus:outline-none"
        />
        <button disabled className="text-bone-500">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
