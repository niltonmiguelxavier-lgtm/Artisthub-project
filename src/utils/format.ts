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

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
