export type StatusId = 'todo' | 'in_progress' | 'review' | 'done';
export type PriorityId = 'low' | 'medium' | 'high' | 'urgent';
export type TypeId = 'task' | 'bug' | 'story';

export const STATUSES: { id: StatusId; label: string; hue: string }[] = [
  { id: 'todo', label: 'Por hacer', hue: 'slate' },
  { id: 'in_progress', label: 'En progreso', hue: 'blue' },
  { id: 'review', label: 'En revisión', hue: 'amber' },
  { id: 'done', label: 'Hecho', hue: 'green' },
];

export const PRIORITIES: { id: PriorityId; label: string; rank: number }[] = [
  { id: 'urgent', label: 'Urgente', rank: 4 },
  { id: 'high', label: 'Alta', rank: 3 },
  { id: 'medium', label: 'Media', rank: 2 },
  { id: 'low', label: 'Baja', rank: 1 },
];

export const TYPES: { id: TypeId; label: string; icon: string }[] = [
  { id: 'task', label: 'Tarea', icon: '✔' },
  { id: 'bug', label: 'Bug', icon: '●' },
  { id: 'story', label: 'Historia', icon: '❖' },
];

export const isStatus = (v: unknown): v is StatusId =>
  STATUSES.some((s) => s.id === v);
export const isPriority = (v: unknown): v is PriorityId =>
  PRIORITIES.some((p) => p.id === v);
export const isType = (v: unknown): v is TypeId => TYPES.some((t) => t.id === v);

export type Member = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  color: string;
};

export type Project = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  lead_id: number | null;
  created_at: string;
};

export type Task = {
  id: number;
  project_id: number;
  seq: number;
  title: string;
  description: string | null;
  status: StatusId;
  priority: PriorityId;
  type: TypeId;
  assignee_id: number | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: number;
  task_id: number;
  author_id: number | null;
  body: string;
  created_at: string;
};

export type ProjectStats = {
  total: number;
  done: number;
  in_progress: number;
  review: number;
  todo: number;
  overdue: number;
  progress: number;
};
