const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** 'YYYY-MM-DD' -> '12 sep' (parsed as a local date, never shifted by UTC). */
export function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const now = new Date();
  const year = y === now.getFullYear() ? '' : ` ${String(y).slice(2)}`;
  return `${d} ${MONTHS[m - 1]}${year}`;
}

export function fmtDateTime(iso: string): string {
  // SQLite datetime('now') returns UTC as 'YYYY-MM-DD HH:MM:SS'.
  const dt = new Date(iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(dt.getTime())) return iso;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

export const today = () => new Date().toISOString().slice(0, 10);

export function isOverdue(due: string | null, status: string): boolean {
  return Boolean(due) && due! < today() && status !== 'done';
}
