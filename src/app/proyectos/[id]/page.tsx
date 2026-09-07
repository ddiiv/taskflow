import { notFound } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { StatusBar } from '@/components/bits';
import Board from '@/components/Board';
import ProjectDialog from '@/components/ProjectDialog';
import {
  getProject,
  listMembers,
  listProjectComments,
  listTasks,
  statsFor,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tarea?: string }>;
}) {
  const { id } = await params;
  const { tarea } = await searchParams;

  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  const project = getProject(projectId);
  if (!project) notFound();

  const tasks = listTasks(projectId);
  const members = listMembers();
  const comments = listProjectComments(projectId);
  const stats = statsFor(tasks);
  const lead = members.find((m) => m.id === project.lead_id) ?? null;

  const openTaskId = Number(tarea);
  const initialTaskId =
    Number.isInteger(openTaskId) && tasks.some((t) => t.id === openTaskId)
      ? openTaskId
      : undefined;

  return (
    <>
      <header className="topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="tkey">{project.key}</span>
            <h1>{project.name}</h1>
          </div>
          <p className="sub">
            {project.description || 'Sin descripción.'}
          </p>
        </div>
        <div className="topbar-actions">
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 6 }}
            title={lead ? `Responsable: ${lead.name}` : 'Sin responsable'}
          >
            <Avatar member={lead} size="sm" />
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              {lead?.name ?? 'Sin responsable'}
            </span>
          </span>
          <ProjectDialog
            members={members}
            project={project}
            label="Ajustes"
            className="btn"
          />
        </div>
      </header>

      <div className="content">
        <div className="stat-row" style={{ marginBottom: 14 }}>
          <div className="stat" style={{ minWidth: 210, flex: '1 1 240px' }}>
            <div className="progress-line">
              <span>
                <b>{stats.progress}%</b> completado
              </span>
              <span>
                {stats.done}/{stats.total} tareas
              </span>
            </div>
            <StatusBar stats={stats} />
          </div>
          <div className="stat">
            <b>{stats.todo}</b>
            <span>Por hacer</span>
          </div>
          <div className="stat">
            <b>{stats.in_progress}</b>
            <span>En progreso</span>
          </div>
          <div className="stat">
            <b>{stats.review}</b>
            <span>En revisión</span>
          </div>
          <div className="stat">
            <b style={{ color: stats.overdue ? 'var(--danger)' : undefined }}>
              {stats.overdue}
            </b>
            <span>Vencidas</span>
          </div>
        </div>

        {members.length === 0 && (
          <p
            className="badge"
            style={{ marginBottom: 12, padding: '6px 11px' }}
          >
            Todavía no cargaste gente en <a href="/equipo" style={{ textDecoration: 'underline' }}>Equipo</a>,
            así que no vas a poder asignar tareas.
          </p>
        )}

        <Board
          project={project}
          tasks={tasks}
          members={members}
          comments={comments}
          initialTaskId={initialTaskId}
        />
      </div>
    </>
  );
}
