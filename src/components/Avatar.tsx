import type { Member } from '@/lib/types';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  member,
  size = 'md',
  title,
}: {
  member?: Member | null;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}) {
  const cls =
    'avatar' + (size === 'sm' ? ' avatar-sm' : size === 'lg' ? ' avatar-lg' : '');

  if (!member) {
    return (
      <span className={cls} data-empty="true" title={title ?? 'Sin asignar'}>
        –
      </span>
    );
  }
  return (
    <span
      className={cls}
      style={{ background: member.color }}
      title={title ?? member.name}
    >
      {initials(member.name)}
    </span>
  );
}
