// Gemeinsame Datentypen für die persönliche Aufgaben- und Planungs-App
export type TodoStatus = 'open' | 'doing' | 'waiting' | 'backlog' | 'done';
export type ProjectStatus = 'active' | 'completed' | 'archived';

export type TodoView =
  | 'active'
  | 'today'
  | 'week'
  | 'open'
  | 'doing'
  | 'waiting'
  | 'backlog'
  | 'done';

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

export interface TodoItem {
  id: string;
  title: string;
  notes: string;
  status: TodoStatus;
  dueDate: string | null;
  dueTime: string | null;
  followUpDate: string | null;
  projectId: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  dueDate: string | null;
  done: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface OrganizerUser {
  displayName: string;
  email: string;
}

export interface OrganizerSnapshot {
  user: OrganizerUser;
  todos: TodoItem[];
  projects: ProjectItem[];
  milestones: MilestoneItem[];
  tags: TagItem[];
}

export interface CalendarEntry {
  id: string;
  sourceId: string;
  kind: 'todo' | 'follow-up' | 'project' | 'milestone';
  date: string;
  title: string;
  color: string;
  projectId?: string;
}
