/**
 * Utilitário de tratamento de erros de autenticação Firebase
 * Trata cancelamentos normais do utilizador (ex: fechar popup) separadamente de erros reais.
 */

export interface AuthErrorResult {
  isCancellation: boolean;
  message: string;
  details?: string;
}

export function parseAuthError(err: any): AuthErrorResult {
  const code: string = err?.code || '';
  const message: string = err?.message || String(err || '');

  // O utilizador fechou a janela ou cancelou o pedido
  if (
    code === 'auth/popup-closed-by-user' ||
    message.includes('popup-closed-by-user') ||
    message.includes('auth/popup-closed-by-user')
  ) {
    return {
      isCancellation: true,
      message: 'Início de sessão cancelado.',
      details: 'A janela de autenticação foi fechada antes de concluir a operação.',
    };
  }

  if (
    code === 'auth/cancelled-popup-request' ||
    message.includes('cancelled-popup-request')
  ) {
    return {
      isCancellation: true,
      message: 'Pedido de autenticação cancelado.',
    };
  }

  if (
    code === 'auth/popup-blocked' ||
    message.includes('popup-blocked')
  ) {
    return {
      isCancellation: false,
      message: 'A janela pop-up foi bloqueada pelo navegador.',
      details: 'Permite pop-ups para este site ou abre a aplicação numa nova janela para continuar com o Google.',
    };
  }

  if (
    code === 'auth/unauthorized-domain' ||
    message.includes('unauthorized-domain')
  ) {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'artisthub-projectn.vercel.app';
    return {
      isCancellation: false,
      message: 'Domínio Web não autorizado no Firebase.',
      details: `O domínio "${currentHost}" precisa de ser adicionado à lista de "Domínios Autorizados" na consola Firebase (Authentication > Definições > Domínios autorizados).`,
    };
  }

  if (
    code === 'auth/network-request-failed' ||
    message.includes('network-request-failed')
  ) {
    return {
      isCancellation: false,
      message: 'Erro de ligação de rede.',
      details: 'Verifica a ligação à internet e tenta novamente.',
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      isCancellation: false,
      message: 'Método de autenticação não ativado na consola.',
      details: 'Por favor utiliza o botão "Continuar com o Google" ou contacta o suporte.',
    };
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return {
      isCancellation: false,
      message: 'Email ou palavra-passe incorretos.',
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      isCancellation: false,
      message: 'Não existe conta com este email.',
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      isCancellation: false,
      message: 'Este email já está registado.',
      details: 'Inicia sessão com este email ou recupera a palavra-passe.',
    };
  }

  if (code === 'auth/weak-password') {
    return {
      isCancellation: false,
      message: 'A palavra-passe deve ter pelo menos 6 caracteres.',
    };
  }

  return {
    isCancellation: false,
    message: err?.message || 'Falha ao autenticar. Tenta novamente.',
  };
}
