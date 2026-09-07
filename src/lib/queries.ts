import { db } from './db';
import type {
  Comment,
  Member,
  Project,
  ProjectStats,
  Task,
} from './types';

export function listMembers(): Member[] {
  return db
    .prepare('SELECT id, name, email, role, color FROM members ORDER BY name COLLATE NOCASE')
    .all() as Member[];
}

export function listProjects(): Project[] {
  return db
    // En el orden en que se crearon: el equipo los define por prioridad.
    .prepare('SELECT * FROM projects ORDER BY created_at ASC, id ASC')
    .all() as Project[];
}

export function getProject(id: number): Project | undefined {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
    | Project
    | undefined;
}

export function listTasks(projectId: number): Task[] {
  return db
    .prepare(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC, id ASC',
    )
    .all(projectId) as Task[];
}

export function listProjectComments(projectId: number): Comment[] {
  return db
    .prepare(
      `SELECT c.* FROM comments c
       JOIN tasks t ON t.id = c.task_id
       WHERE t.project_id = ?
       ORDER BY c.created_at ASC, c.id ASC`,
    )
    .all(projectId) as Comment[];
}

const EMPTY_STATS: ProjectStats = {
  total: 0,
  done: 0,
  in_progress: 0,
  review: 0,
  todo: 0,
  overdue: 0,
  progress: 0,
};

export function statsFor(tasks: Task[]): ProjectStats {
  const today = new Date().toISOString().slice(0, 10);
  const s = { ...EMPTY_STATS };
  for (const t of tasks) {
    s.total += 1;
    s[t.status] += 1;
    if (t.due_date && t.due_date < today && t.status !== 'done') s.overdue += 1;
  }
  s.progress = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
  return s;
}

/** Stats for every project in one pass — used by the dashboard. */
export function statsByProject(): Map<number, ProjectStats> {
  const rows = db
    .prepare('SELECT project_id, status, due_date FROM tasks')
    .all() as Pick<Task, 'project_id' | 'status' | 'due_date'>[];
  const today = new Date().toISOString().slice(0, 10);
  const map = new Map<number, ProjectStats>();
  for (const r of rows) {
    const s = map.get(r.project_id) ?? { ...EMPTY_STATS };
    s.total += 1;
    s[r.status] += 1;
    if (r.due_date && r.due_date < today && r.status !== 'done') s.overdue += 1;
    map.set(r.project_id, s);
  }
  for (const s of map.values()) {
    s.progress = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
  }
  return map;
}

export type TaskWithProject = Task & { project_key: string; project_name: string };

export function listOpenTasks(): TaskWithProject[] {
  return db
    .prepare(
      `SELECT t.*, p.key AS project_key, p.name AS project_name
       FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE t.status <> 'done'
       ORDER BY
         CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
         t.due_date ASC,
         CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1
                         WHEN 'medium' THEN 2 ELSE 3 END,
         t.id DESC`,
    )
    .all() as TaskWithProject[];
}

export type MemberWorkload = Member & {
  open: number;
  done: number;
  overdue: number;
};

export function workload(): MemberWorkload[] {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .prepare(
      `SELECT m.id, m.name, m.email, m.role, m.color,
              COALESCE(SUM(CASE WHEN t.status <> 'done' THEN 1 ELSE 0 END), 0) AS open,
              COALESCE(SUM(CASE WHEN t.status  = 'done' THEN 1 ELSE 0 END), 0) AS done,
              COALESCE(SUM(CASE WHEN t.status <> 'done' AND t.due_date IS NOT NULL
                                 AND t.due_date < ? THEN 1 ELSE 0 END), 0) AS overdue
       FROM members m
       LEFT JOIN tasks t ON t.assignee_id = m.id
       GROUP BY m.id
       ORDER BY m.name COLLATE NOCASE`,
    )
    .all(today) as MemberWorkload[];
}
