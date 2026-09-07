import { PRIORITIES, STATUSES, TYPES, type ProjectStats } from '@/lib/types';

/** Stacked bar showing how a project's tasks are distributed by status. */
export function StatusBar({ stats }: { stats: ProjectStats }) {
  if (stats.total === 0) {
    return <div className="bar" aria-label="Sin tareas" />;
  }
  return (
    <div
      className="bar"
      role="img"
      aria-label={`${stats.progress}% completado`}
    >
      {STATUSES.map((s) => {
        const n = stats[s.id];
        if (!n) return null;
        return (
          <span
            key={s.id}
            title={`${s.label}: ${n}`}
            style={{
              width: `${(n / stats.total) * 100}%`,
              background: `var(--s-${s.id})`,
            }}
          />
        );
      })}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find((x) => x.id === status);
  return (
    <span className="badge">
      <span className="dot" style={{ background: `var(--s-${status})` }} />
      {s?.label ?? status}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: string }) {
  const p = PRIORITIES.find((x) => x.id === priority);
  const arrows: Record<string, string> = {
    urgent: '⇈',
    high: '↑',
    medium: '=',
    low: '↓',
  };
  return (
    <span className="prio" data-p={priority} title={`Prioridad: ${p?.label}`}>
      {arrows[priority] ?? '='} {p?.label ?? priority}
    </span>
  );
}

export function TypeIcon({ type }: { type: string }) {
  const t = TYPES.find((x) => x.id === type);
  const color =
    type === 'bug' ? 'var(--p-urgent)' : type === 'story' ? '#16a34a' : 'var(--p-medium)';
  return (
    <span className="tcard-type" style={{ color }} title={t?.label ?? type}>
      {t?.icon ?? '✔'}
    </span>
  );
}
