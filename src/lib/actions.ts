'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from './db';
import {
  isPriority,
  isStatus,
  isType,
  type StatusId,
  type Task,
} from './types';

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b',
  '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16',
];

function str(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === 'string' ? v.trim() : '';
}

function num(fd: FormData, name: string): number | null {
  const v = str(fd, name);
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function refresh(projectId?: number) {
  revalidatePath('/');
  revalidatePath('/equipo');
  if (projectId) revalidatePath(`/proyectos/${projectId}`);
}

/* ------------------------------------------------------------------ projects */

function slugKey(raw: string, fallback: string): string {
  // "Migración" -> "MIGRACION", so accents shorten the key instead of vanishing.
  const clean = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

  const base = clean(raw).slice(0, 6) || clean(fallback).slice(0, 4) || 'PROY';

  const taken = new Set(
    (db.prepare('SELECT key FROM projects').all() as { key: string }[]).map(
      (r) => r.key,
    ),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export async function createProject(fd: FormData) {
  const name = str(fd, 'name');
  if (!name) return;
  const key = slugKey(str(fd, 'key'), name);
  const info = db
    .prepare(
      'INSERT INTO projects (key, name, description, lead_id) VALUES (?, ?, ?, ?)',
    )
    .run(key, name, str(fd, 'description') || null, num(fd, 'lead_id'));
  refresh();
  redirect(`/proyectos/${info.lastInsertRowid}`);
}

export async function updateProject(fd: FormData) {
  const id = num(fd, 'id');
  const name = str(fd, 'name');
  if (!id || !name) return;
  db.prepare(
    'UPDATE projects SET name = ?, description = ?, lead_id = ? WHERE id = ?',
  ).run(name, str(fd, 'description') || null, num(fd, 'lead_id'), id);
  refresh(id);
}

export async function deleteProject(fd: FormData) {
  const id = num(fd, 'id');
  if (!id) return;
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  refresh();
  redirect('/');
}

/* ------------------------------------------------------------------- members */

export async function createMember(fd: FormData) {
  const name = str(fd, 'name');
  if (!name) return;
  const count = (
    db.prepare('SELECT COUNT(*) AS n FROM members').get() as { n: number }
  ).n;
  db.prepare(
    'INSERT INTO members (name, email, role, color) VALUES (?, ?, ?, ?)',
  ).run(
    name,
    str(fd, 'email') || null,
    str(fd, 'role') || null,
    AVATAR_COLORS[count % AVATAR_COLORS.length],
  );
  refresh();
}

export async function updateMember(fd: FormData) {
  const id = num(fd, 'id');
  const name = str(fd, 'name');
  if (!id || !name) return;
  db.prepare('UPDATE members SET name = ?, email = ?, role = ? WHERE id = ?').run(
    name,
    str(fd, 'email') || null,
    str(fd, 'role') || null,
    id,
  );
  refresh();
}

export async function deleteMember(fd: FormData) {
  const id = num(fd, 'id');
  if (!id) return;
  // ON DELETE SET NULL keeps the tasks; they simply become unassigned.
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  refresh();
}

/* --------------------------------------------------------------------- tasks */

const nextSeq = db.prepare(
  'SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM tasks WHERE project_id = ?',
);
const nextPosition = db.prepare(
  'SELECT COALESCE(MAX(position), 0) + 1 AS n FROM tasks WHERE project_id = ? AND status = ?',
);

export async function createTask(fd: FormData) {
  const projectId = num(fd, 'project_id');
  const title = str(fd, 'title');
  if (!projectId || !title) return;

  const statusRaw = str(fd, 'status');
  const status: StatusId = isStatus(statusRaw) ? statusRaw : 'todo';
  const priorityRaw = str(fd, 'priority');
  const typeRaw = str(fd, 'type');

  const seq = (nextSeq.get(projectId) as { n: number }).n;
  const position = (nextPosition.get(projectId, status) as { n: number }).n;

  db.prepare(
    `INSERT INTO tasks
       (project_id, seq, title, description, status, priority, type, assignee_id, due_date, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    projectId,
    seq,
    title,
    str(fd, 'description') || null,
    status,
    isPriority(priorityRaw) ? priorityRaw : 'medium',
    isType(typeRaw) ? typeRaw : 'task',
    num(fd, 'assignee_id'),
    str(fd, 'due_date') || null,
    position,
  );
  refresh(projectId);
}

export async function updateTask(fd: FormData) {
  const id = num(fd, 'id');
  const title = str(fd, 'title');
  if (!id || !title) return;

  const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
    | Task
    | undefined;
  if (!current) return;

  const statusRaw = str(fd, 'status');
  const status: StatusId = isStatus(statusRaw) ? statusRaw : current.status;
  const priorityRaw = str(fd, 'priority');
  const typeRaw = str(fd, 'type');

  // Moving column through the form: park the task at the end of its new column.
  const position =
    status === current.status
      ? current.position
      : (nextPosition.get(current.project_id, status) as { n: number }).n;

  db.prepare(
    `UPDATE tasks SET
       title = ?, description = ?, status = ?, priority = ?, type = ?,
       assignee_id = ?, due_date = ?, position = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    title,
    str(fd, 'description') || null,
    status,
    isPriority(priorityRaw) ? priorityRaw : current.priority,
    isType(typeRaw) ? typeRaw : current.type,
    num(fd, 'assignee_id'),
    str(fd, 'due_date') || null,
    position,
    id,
  );
  refresh(current.project_id);
}

export async function deleteTask(fd: FormData) {
  const id = num(fd, 'id');
  if (!id) return;
  const t = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(id) as
    | { project_id: number }
    | undefined;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  refresh(t?.project_id);
}

/** Drag & drop: drop `taskId` into `status` at `index`, renumbering the column. */
export async function moveTask(
  taskId: number,
  status: string,
  index: number,
): Promise<void> {
  if (!isStatus(status)) return;

  const move = (id: number, to: StatusId, at: number) => db.tx(() => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
      | Task
      | undefined;
    if (!task) return null;

    const column = (
      db
        .prepare(
          `SELECT id FROM tasks
           WHERE project_id = ? AND status = ? AND id <> ?
           ORDER BY position ASC, id ASC`,
        )
        .all(task.project_id, to, id) as { id: number }[]
    ).map((r) => r.id);

    column.splice(Math.max(0, Math.min(at, column.length)), 0, id);

    const setPos = db.prepare(
      "UPDATE tasks SET position = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
    );
    column.forEach((tid, i) => setPos.run(i, to, tid));
    return task.project_id;
  });

  const projectId = move(taskId, status, index);
  if (projectId) refresh(projectId);
}

/* ------------------------------------------------------------------ comments */

export async function addComment(fd: FormData) {
  const taskId = num(fd, 'task_id');
  const body = str(fd, 'body');
  if (!taskId || !body) return;
  db.prepare('INSERT INTO comments (task_id, author_id, body) VALUES (?, ?, ?)').run(
    taskId,
    num(fd, 'author_id'),
    body,
  );
  const t = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId) as
    | { project_id: number }
    | undefined;
  refresh(t?.project_id);
}

export async function deleteComment(fd: FormData) {
  const id = num(fd, 'id');
  const projectId = num(fd, 'project_id');
  if (!id) return;
  db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  refresh(projectId ?? undefined);
}
