export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-PT').format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('pt-PT').format(value)} MT`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'Por definir';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'agora';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `há ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
  }

  return formatDate(dateStr);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
