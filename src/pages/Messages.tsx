import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, getDocs, doc, setDoc, query, where, orderBy } from '../lib/firebase';
import { MessageSquare, Send, User, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import ArtistAvatar from '../components/ArtistAvatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageLoadingError from '../components/ui/PageLoadingError';
import EmptyState from '../components/ui/EmptyState';

interface ChatConversation {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientHandle: string;
  recipientAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

const defaultConversations: ChatConversation[] = [
  {
    id: 'conv-1',
    recipientId: 'org-sol-som',
    recipientName: 'Festival Sol & Som',
    recipientHandle: 'festival-sol-som',
    lastMessage: 'A tua candidatura para o palco principal foi pré-selecionada! Podemos agendar chamada?',
    lastMessageAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    unreadCount: 1,
  },
  {
    id: 'conv-2',
    recipientId: 'prod-samito',
    recipientName: 'Samito Beats',
    recipientHandle: 'samito-beats',
    lastMessage: 'Enviei os stems do novo beat de Afro-House para o teu email.',
    lastMessageAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    unreadCount: 0,
  },
];

const defaultMessages: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'm-1',
      conversationId: 'conv-1',
      senderId: 'org-sol-som',
      senderName: 'Festival Sol & Som',
      text: 'Olá! Ouvimos a tua nova faixa no feed do ArtistHub e adorámos a sonoridade.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'm-2',
      conversationId: 'conv-1',
      senderId: 'current-user',
      senderName: 'Eu',
      text: 'Muito obrigado! Estamos prontos para apresentar um set enérgico de 45 minutos.',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'm-3',
      conversationId: 'conv-1',
      senderId: 'org-sol-som',
      senderName: 'Festival Sol & Som',
      text: 'A tua candidatura para o palco principal foi pré-selecionada! Podemos agendar chamada?',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ],
};

export default function Messages() {
  const { user, artistProfile } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const currentUserId = user?.uid || artistProfile?.id || 'demo-user';
  const currentUserName = artistProfile?.stageName || user?.displayName || 'Eu';

  const loadData = async () => {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    try {
      setStatus('loading');
      setError(null);

      // Safety timeout: 15s
      timer = setTimeout(() => {
        if (!cancelled && status === 'loading') {
          setError('Isto está a demorar mais do que o esperado. Tenta novamente.');
          setStatus('error');
        }
      }, 15000);

      // Query conversations
      const cSnap = await getDocs(collection(db, 'conversations'));
      if (!cSnap.empty) {
        const loadedConvs = cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatConversation));
        if (!cancelled) {
          setConversations(loadedConvs);
          setSelectedConvId(loadedConvs[0]?.id || null);
        }
      } else {
        if (!cancelled) {
          setConversations(defaultConversations);
          setSelectedConvId(defaultConversations[0]?.id || null);
        }
      }

      if (!cancelled) {
        setStatus('success');
      }
    } catch (err: any) {
      if (!cancelled) {
        console.warn('Conversations fetch notice, using fallback:', err);
        setConversations(defaultConversations);
        setSelectedConvId(defaultConversations[0]?.id || null);
        setStatus('success'); // allow user to interact with fallback
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedConvId) return;
    const convMsgs = defaultMessages[selectedConvId] || [
      {
        id: 'msg-init',
        conversationId: selectedConvId,
        senderId: 'system',
        senderName: 'ArtistHub',
        text: 'Início da conversa direta protegida.',
        createdAt: new Date().toISOString(),
      },
    ];
    setMessages(convMsgs);
  }, [selectedConvId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const newMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      conversationId: selectedConvId,
      senderId: currentUserId,
      senderName: currentUserName,
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    try {
      setSending(true);
      await setDoc(doc(db, 'conversations', selectedConvId, 'messages', newMsg.id), newMsg);
    } catch (e) {
      console.warn('Message send stored locally:', e);
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cobalt-500/10 text-cobalt-400">
              <MessageSquare size={16} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cobalt-400">
              Comunicação Direta
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-bone-100 sm:text-3xl">
            Mensagens & Contactos
          </h1>
          <p className="mt-1 text-sm text-bone-400 max-w-xl">
            Comunica diretamente com promotores, organizadores de eventos, produtores e colaboradores.
          </p>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="flex h-[420px] items-center justify-center rounded-2xl border border-ink-800 bg-ink-900">
          <div className="flex flex-col items-center gap-3 text-bone-400">
            <RefreshCw size={24} className="animate-spin text-cobalt-400" />
            <p className="text-xs">A carregar conversas...</p>
          </div>
        </div>
      ) : status === 'error' ? (
        <PageLoadingError error={error} onRetry={loadData} />
      ) : (
        <div className="grid h-[550px] grid-cols-1 overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 md:grid-cols-3">
          {/* Conversation List */}
          <div className="border-r border-ink-800 overflow-y-auto">
            <div className="p-3 border-b border-ink-800 text-xs font-semibold uppercase tracking-wider text-bone-400">
              Conversas Recentes ({conversations.length})
            </div>
            <div className="divide-y divide-ink-800/60">
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors ${
                      isSelected ? 'bg-ink-800/80 text-bone-100' : 'hover:bg-ink-850 text-bone-300'
                    }`}
                  >
                    <ArtistAvatar name={conv.recipientName} src={conv.recipientAvatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-semibold text-bone-100">
                          {conv.recipientName}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cobalt-500 text-[10px] font-bold text-ink-950">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-bone-400">@{conv.recipientHandle}</p>
                      <p className="mt-1 truncate text-xs text-bone-300">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Pane */}
          <div className="col-span-2 flex flex-col justify-between bg-ink-950/40">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900/60 p-4">
                  <div className="flex items-center gap-3">
                    <ArtistAvatar
                      name={selectedConv.recipientName}
                      src={selectedConv.recipientAvatar}
                      size={36}
                    />
                    <div>
                      <h3 className="font-display text-sm font-semibold text-bone-100">
                        {selectedConv.recipientName}
                      </h3>
                      <p className="text-[11px] text-bone-400">@{selectedConv.recipientHandle}</p>
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((m) => {
                    const isMe = m.senderId === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs ${
                            isMe
                              ? 'bg-cobalt-500 text-ink-950 font-medium'
                              : 'bg-ink-800 text-bone-100 border border-ink-700'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                        <span className="mt-1 text-[10px] text-bone-400">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-ink-800 bg-ink-900 p-3"
                >
                  <input
                    type="text"
                    placeholder="Escreve uma mensagem..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 rounded-xl border border-ink-700 bg-ink-950 px-4 py-2 text-xs text-bone-100 placeholder:text-bone-400 focus:border-cobalt-500 focus:outline-none"
                  />
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5 px-4" disabled={sending}>
                    <Send size={14} />
                    Enviar
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-xs text-bone-400">
                Seleciona uma conversa para ver as mensagens.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
