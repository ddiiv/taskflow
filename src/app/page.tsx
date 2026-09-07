import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { PriorityTag, StatusBadge, StatusBar } from '@/components/bits';
import ProjectDialog from '@/components/ProjectDialog';
import { fmtDate, isOverdue } from '@/lib/format';
import {
  listMembers,
  listOpenTasks,
  listProjects,
  statsByProject,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const projects = listProjects();
  const members = listMembers();
  const stats = statsByProject();
  const open = listOpenTasks();

  const byId = new Map(members.map((m) => [m.id, m]));
  const empty = { total: 0, done: 0, in_progress: 0, review: 0, todo: 0, overdue: 0, progress: 0 };

  const totals = projects.reduce(
    (acc, p) => {
      const s = stats.get(p.id) ?? empty;
      acc.total += s.total;
      acc.done += s.done;
      acc.overdue += s.overdue;
      acc.active += s.in_progress + s.review;
      return acc;
    },
    { total: 0, done: 0, overdue: 0, active: 0 },
  );

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Panel</h1>
          <p className="sub">
            Estado general de {projects.length}{' '}
            {projects.length === 1 ? 'proyecto' : 'proyectos'}.
          </p>
        </div>
        <div className="topbar-actions">
          <ProjectDialog members={members} label="+ Nuevo proyecto" />
        </div>
      </header>

      <div className="content">
        <div className="stat-row">
          <div className="stat">
            <b>{projects.length}</b>
            <span>Proyectos</span>
          </div>
          <div className="stat">
            <b>{totals.total - totals.done}</b>
            <span>Tareas abiertas</span>
          </div>
          <div className="stat">
            <b>{totals.active}</b>
            <span>En curso</span>
          </div>
          <div className="stat">
            <b>{totals.done}</b>
            <span>Completadas</span>
          </div>
          <div className="stat">
            <b style={{ color: totals.overdue ? 'var(--danger)' : undefined }}>
              {totals.overdue}
            </b>
            <span>Vencidas</span>
          </div>
        </div>

        <div className="section-title">
          <h2>Proyectos</h2>
        </div>

        {projects.length === 0 ? (
          <div className="empty">
            <h3>Todavía no hay proyectos</h3>
            <p style={{ marginBottom: 16 }}>
              Creá el primero y empezá a cargar tareas en el tablero.
            </p>
            <ProjectDialog members={members} label="+ Nuevo proyecto" />
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((p) => {
              const s = stats.get(p.id) ?? empty;
              const lead = p.lead_id ? byId.get(p.lead_id) : null;
              return (
                <Link
                  key={p.id}
                  href={`/proyectos/${p.id}`}
                  className="card project-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="pk">{p.key}</span>
                    {s.overdue > 0 && (
                      <span
                        className="badge"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        {s.overdue} vencida{s.overdue > 1 ? 's' : ''}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto' }}>
                      <Avatar member={lead} size="sm" title={lead ? `Responsable: ${lead.name}` : 'Sin responsable'} />
                    </span>
                  </div>

                  <div>
                    <h3>{p.name}</h3>
                    <p className="desc">{p.description || 'Sin descripción.'}</p>
                  </div>

                  <div>
                    <div className="progress-line">
                      <span>
                        <b>{s.progress}%</b> completado
                      </span>
                      <span>
                        {s.done}/{s.total} tareas
                      </span>
                    </div>
                    <StatusBar stats={s} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {open.length > 0 && (
          <>
            <div className="section-title">
              <h2>Próximas tareas</h2>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {open.length} abiertas · ordenadas por vencimiento y prioridad
              </span>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 92 }}>Tarea</th>
                    <th>Título</th>
                    <th style={{ width: 128 }}>Estado</th>
                    <th style={{ width: 108 }}>Prioridad</th>
                    <th style={{ width: 150 }}>Responsable</th>
                    <th style={{ width: 96 }}>Vence</th>
                  </tr>
                </thead>
                <tbody>
                  {open.slice(0, 10).map((t) => {
                    const a = t.assignee_id ? byId.get(t.assignee_id) : null;
                    const late = isOverdue(t.due_date, t.status);
                    return (
                      <tr key={t.id}>
                        <td>
                          <Link href={`/proyectos/${t.project_id}?tarea=${t.id}`} className="tkey">
                            {t.project_key}-{t.seq}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/proyectos/${t.project_id}?tarea=${t.id}`}>
                            {t.title}
                          </Link>
                        </td>
                        <td><StatusBadge status={t.status} /></td>
                        <td><PriorityTag priority={t.priority} /></td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Avatar member={a} size="sm" />
                            <span style={{ color: a ? undefined : 'var(--faint)' }}>
                              {a?.name ?? 'Sin asignar'}
                            </span>
                          </span>
                        </td>
                        <td className={late ? 'overdue' : undefined}>
                          {t.due_date ? fmtDate(t.due_date) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
