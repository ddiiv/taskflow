'use client';

import { useEffect, useState } from 'react';
import Avatar from '@/components/Avatar';
import { addComment, createTask, deleteComment, deleteTask, updateTask } from '@/lib/actions';
import { fmtDateTime } from '@/lib/format';
import {
  PRIORITIES,
  STATUSES,
  TYPES,
  type Comment,
  type Member,
  type Project,
  type StatusId,
  type Task,
} from '@/lib/types';
import { Modal, SubmitButton } from './ui';

const AUTHOR_KEY = 'taskflow:last-author';

export default function TaskDialog({
  mode,
  project,
  members,
  task,
  comments,
  defaultStatus = 'todo',
  onClose,
}: {
  mode: 'create' | 'edit';
  project: Project;
  members: Member[];
  task?: Task;
  comments: Comment[];
  defaultStatus?: StatusId;
  onClose: () => void;
}) {
  const editing: Task | null = mode === 'edit' && task ? task : null;
  const [author, setAuthor] = useState('');

  useEffect(() => {
    try {
      setAuthor(localStorage.getItem(AUTHOR_KEY) ?? '');
    } catch {
      /* storage may be unavailable; the select just stays empty */
    }
  }, []);

  const membersById = new Map(members.map((m) => [m.id, m]));

  return (
    <Modal
      wide
      onClose={onClose}
      title={
        editing ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tkey">
              {project.key}-{editing.seq}
            </span>
            <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
              en {project.name}
            </span>
          </span>
        ) : (
          `Nueva tarea en ${project.name}`
        )
      }
    >
      <form
        action={async (fd: FormData) => {
          if (editing) await updateTask(fd);
          else await createTask(fd);
          onClose();
        }}
      >
        <input type="hidden" name="project_id" value={project.id} />
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="detail">
          <div className="detail-main">
            <div className="field">
              <label htmlFor="t-title">Título</label>
              <input
                id="t-title"
                className="input"
                name="title"
                required
                autoFocus={!editing}
                maxLength={160}
                placeholder="Qué hay que hacer"
                defaultValue={task?.title ?? ''}
              />
            </div>
            <div className="field">
              <label htmlFor="t-desc">Descripción</label>
              <textarea
                id="t-desc"
                className="textarea"
                name="description"
                placeholder="Contexto, criterios de aceptación, links…"
                defaultValue={task?.description ?? ''}
              />
            </div>
          </div>

          <div className="detail-side">
            <div className="field">
              <label htmlFor="t-status">Estado</label>
              <select
                id="t-status"
                className="select"
                name="status"
                defaultValue={task?.status ?? defaultStatus}
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-assignee">Responsable</label>
              <select
                id="t-assignee"
                className="select"
                name="assignee_id"
                defaultValue={task?.assignee_id ?? ''}
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-priority">Prioridad</label>
              <select
                id="t-priority"
                className="select"
                name="priority"
                defaultValue={task?.priority ?? 'medium'}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-type">Tipo</label>
              <select
                id="t-type"
                className="select"
                name="type"
                defaultValue={task?.type ?? 'task'}
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-due">Fecha límite</label>
              <input
                id="t-due"
                className="input"
                type="date"
                name="due_date"
                defaultValue={task?.due_date ?? ''}
              />
            </div>
            {editing && (
              <p style={{ fontSize: 11.5, color: 'var(--faint)' }}>
                Creada el {fmtDateTime(editing.created_at)}
                <br />
                Última actualización {fmtDateTime(editing.updated_at)}
              </p>
            )}
          </div>
        </div>

        <div className="modal-foot">
          {editing && (
            <button
              type="submit"
              form="task-delete"
              className="btn btn-danger left"
              onClick={(e) => {
                if (!confirm(`¿Eliminar ${project.key}-${editing.seq}?`))
                  e.preventDefault();
              }}
            >
              Eliminar
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <SubmitButton>{editing ? 'Guardar' : 'Crear tarea'}</SubmitButton>
        </div>
      </form>

      {editing && (
        <>
          {/* Kept out of the edit form — HTML does not allow nested forms. */}
          <form id="task-delete" action={deleteTask} hidden>
            <input type="hidden" name="id" value={editing.id} />
          </form>

          <section style={{ padding: '4px 18px 18px' }}>
            <h3
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                color: 'var(--muted)',
                marginBottom: 6,
              }}
            >
              Seguimiento ({comments.length})
            </h3>

            {comments.map((c) => {
              const a = c.author_id ? membersById.get(c.author_id) : null;
              return (
                <div className="comment" key={c.id}>
                  <Avatar member={a} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="comment-meta">
                      <b>{a?.name ?? 'Anónimo'}</b> · {fmtDateTime(c.created_at)}
                    </div>
                    <div className="comment-body">{c.body}</div>
                  </div>
                  <form action={deleteComment} className="del">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="project_id" value={project.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm"
                      title="Borrar comentario"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              );
            })}

            <form
              className="inline-form"
              style={{ marginTop: 12 }}
              action={async (fd: FormData) => {
                const who = String(fd.get('author_id') ?? '');
                try {
                  localStorage.setItem(AUTHOR_KEY, who);
                } catch {
                  /* ignore */
                }
                setAuthor(who);
                await addComment(fd);
                // React 19 limpia el formulario solo al terminar la action.
              }}
            >
              <input type="hidden" name="task_id" value={editing.id} />
              <textarea
                className="textarea"
                name="body"
                required
                placeholder="Avance, bloqueo, decisión…"
                style={{ minHeight: 62 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  key={author}
                  className="select"
                  name="author_id"
                  defaultValue={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={{ width: 'auto', minWidth: 160 }}
                  aria-label="Autor del comentario"
                >
                  <option value="">Anónimo</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span style={{ marginLeft: 'auto' }}>
                  <SubmitButton className="btn" pendingLabel="Enviando…">
                    Comentar
                  </SubmitButton>
                </span>
              </div>
            </form>
          </section>
        </>
      )}
    </Modal>
  );
}
