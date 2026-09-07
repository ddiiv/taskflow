'use client';

import { useOptimistic, useState, useTransition } from 'react';
import Avatar from '@/components/Avatar';
import { PriorityTag, TypeIcon } from '@/components/bits';
import TaskDialog from '@/components/TaskDialog';
import { moveTask } from '@/lib/actions';
import { fmtDate, isOverdue } from '@/lib/format';
import {
  PRIORITIES,
  STATUSES,
  type Comment,
  type Member,
  type Project,
  type StatusId,
  type Task,
} from '@/lib/types';

type Move = { id: number; status: StatusId; index: number };

/** Same reordering the server does, applied locally so the drop feels instant. */
function applyMove(tasks: Task[], mv: Move): Task[] {
  const moved = tasks.find((t) => t.id === mv.id);
  if (!moved) return tasks;

  const column = tasks
    .filter((t) => t.status === mv.status && t.id !== mv.id)
    .sort((a, b) => a.position - b.position || a.id - b.id);

  column.splice(Math.max(0, Math.min(mv.index, column.length)), 0, moved);

  const positions = new Map(column.map((t, i) => [t.id, i]));
  return tasks.map((t) =>
    positions.has(t.id)
      ? { ...t, status: mv.status, position: positions.get(t.id)! }
      : t,
  );
}

export default function Board({
  project,
  tasks,
  members,
  comments,
  initialTaskId,
}: {
  project: Project;
  tasks: Task[];
  members: Member[];
  comments: Comment[];
  initialTaskId?: number;
}) {
  const [optimistic, pushMove] = useOptimistic(tasks, applyMove);
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [assignee, setAssignee] = useState('all');
  const [priority, setPriority] = useState('all');

  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<{ status: StatusId; before: number | null } | null>(null);

  const [openId, setOpenId] = useState<number | null>(initialTaskId ?? null);
  const [creatingIn, setCreatingIn] = useState<StatusId | null>(null);

  const membersById = new Map(members.map((m) => [m.id, m]));

  const matches = (t: Task) => {
    if (query) {
      const q = query.toLowerCase();
      const key = `${project.key}-${t.seq}`.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !key.includes(q) &&
        !(t.description ?? '').toLowerCase().includes(q)
      )
        return false;
    }
    if (assignee === 'none' && t.assignee_id !== null) return false;
    if (assignee !== 'all' && assignee !== 'none' && String(t.assignee_id) !== assignee)
      return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    return true;
  };

  const sortCol = (a: Task, b: Task) => a.position - b.position || a.id - b.id;
  const column = (s: StatusId) =>
    optimistic.filter((t) => t.status === s).sort(sortCol);
  const visibleColumn = (s: StatusId) => column(s).filter(matches);

  const filtering = query !== '' || assignee !== 'all' || priority !== 'all';
  const openTask = openId ? optimistic.find((t) => t.id === openId) ?? null : null;

  function drop(status: StatusId, before: number | null) {
    const id = dragId;
    setDragId(null);
    setOver(null);
    if (!id) return;

    const full = column(status);
    const rest = full.filter((t) => t.id !== id);
    const at = before === null ? -1 : rest.findIndex((t) => t.id === before);
    const index = at === -1 ? rest.length : at;

    // Dropping a card back where it already was changes nothing.
    const currentIndex = full.findIndex((t) => t.id === id);
    if (currentIndex !== -1 && currentIndex === index) return;

    startTransition(async () => {
      pushMove({ id, status, index });
      await moveTask(id, status, index);
    });
  }

  return (
    <>
      <div className="board-toolbar">
        <input
          className="input search"
          placeholder="Buscar por título o clave…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="select"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          aria-label="Filtrar por responsable"
        >
          <option value="all">Todos los responsables</option>
          <option value="none">Sin asignar</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Filtrar por prioridad"
        >
          <option value="all">Toda prioridad</option>
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {filtering && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setQuery('');
              setAssignee('all');
              setPriority('all');
            }}
          >
            Limpiar filtros
          </button>
        )}
        <span style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreatingIn('todo')}
          >
            + Nueva tarea
          </button>
        </span>
      </div>

      <div className="board">
        {STATUSES.map((s) => {
          const list = visibleColumn(s.id);
          const isOver = over?.status === s.id;
          return (
            <section
              key={s.id}
              className="column"
              data-over={isOver}
              onDragOver={(e) => {
                if (dragId === null) return;
                e.preventDefault();
                setOver({ status: s.id, before: null });
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(s.id, isOver ? (over?.before ?? null) : null);
              }}
            >
              <header className="column-head">
                <span className="dot" style={{ background: `var(--s-${s.id})` }} />
                {s.label}
                <span className="count">{list.length}</span>
              </header>

              <div className="column-body">
                {list.map((t) => {
                  const a = t.assignee_id ? membersById.get(t.assignee_id) : null;
                  const late = isOverdue(t.due_date, t.status);
                  return (
                    <div key={t.id}>
                      {isOver && over?.before === t.id && <div className="drop-line" />}
                      <div
                        className="tcard"
                        role="button"
                        tabIndex={0}
                        draggable
                        data-dragging={dragId === t.id}
                        onClick={() => setOpenId(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOpenId(t.id);
                          }
                        }}
                        onDragStart={(e) => {
                          setDragId(t.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(t.id));
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOver(null);
                        }}
                        onDragOver={(e) => {
                          if (dragId === null) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const box = e.currentTarget.getBoundingClientRect();
                          const after = e.clientY > box.top + box.height / 2;
                          const idx = list.findIndex((x) => x.id === t.id);
                          const next = after ? list[idx + 1] : t;
                          setOver({ status: s.id, before: next ? next.id : null });
                        }}
                      >
                        <div className="tcard-title">{t.title}</div>
                        <div className="tcard-meta">
                          <TypeIcon type={t.type} />
                          <span className="tkey">
                            {project.key}-{t.seq}
                          </span>
                          <PriorityTag priority={t.priority} />
                          <span className="spacer" />
                          {t.due_date && (
                            <span
                              className={'tcard-due' + (late ? ' overdue' : '')}
                              title={late ? 'Vencida' : 'Fecha límite'}
                            >
                              ◷ {fmtDate(t.due_date)}
                            </span>
                          )}
                          <Avatar member={a} size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isOver && over?.before === null && <div className="drop-line" />}

                {list.length === 0 && (
                  <p
                    style={{
                      color: 'var(--faint)',
                      fontSize: 12.5,
                      padding: '10px 4px',
                    }}
                  >
                    {filtering ? 'Nada coincide con el filtro.' : 'Sin tareas.'}
                  </p>
                )}
              </div>

              <div className="column-foot">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setCreatingIn(s.id)}
                >
                  + Agregar tarea
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {creatingIn && (
        <TaskDialog
          mode="create"
          project={project}
          members={members}
          comments={[]}
          defaultStatus={creatingIn}
          onClose={() => setCreatingIn(null)}
        />
      )}

      {openTask && (
        <TaskDialog
          mode="edit"
          project={project}
          members={members}
          task={openTask}
          comments={comments.filter((c) => c.task_id === openTask.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
