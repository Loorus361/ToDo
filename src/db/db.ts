import Dexie, { type EntityTable } from 'dexie';

// ─── Dirty-Tracking ───────────────────────────────────────────────────────────
// Callback-Pattern: verhindert zirkuläre Abhängigkeiten zum Store.
let _onDirty: (() => void) | null = null;

/** Registriert einen Callback, der bei jedem DB-Schreibvorgang aufgerufen wird. */
export function registerDirtyCallback(cb: () => void): void {
  _onDirty = cb;
}

function markDirty(): void {
  _onDirty?.();
}

export interface Project {
  id?: number;
  title: string;
  deadline?: string;
}

export interface Person {
  id?: number;
  name: string;
}

export interface Communication {
  id?: number;
  type: 'In' | 'Out';
  medium: 'Mail' | 'Phone';
  timestamp: string;
  content: string;
  personId?: number;
  projectId?: number;
  generatedTodoId?: number;
}

export interface Todo {
  id?: number;
  title: string;
  status: 'backlog' | 'doing' | 'done';
  deadline?: string;
  startDate?: string;
  startAfterId?: number;
  projectId?: number;
  commId?: number;
}

class AppDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  persons!: EntityTable<Person, 'id'>;
  communications!: EntityTable<Communication, 'id'>;
  todos!: EntityTable<Todo, 'id'>;

  constructor() {
    super('todo-manager-db');
    this.version(1).stores({
      projects: '++id, title, deadline',
      persons: '++id, name',
      communications: '++id, type, medium, timestamp, content, personId, projectId, generatedTodoId',
      todos: '++id, title, status, deadline, startDate, startAfterId, projectId, commId',
    });

    // Dirty-Hooks: bei jedem Schreibvorgang markDirty() aufrufen
    const tables = [this.projects, this.persons, this.communications, this.todos] as Dexie.Table[];
    for (const table of tables) {
      table.hook('creating', () => markDirty());
      table.hook('updating', () => markDirty());
      table.hook('deleting', () => markDirty());
    }
  }
}

export const db = new AppDB();

export async function deleteProjectCascade(projectId: number): Promise<void> {
  await db.transaction('rw', db.projects, db.todos, db.communications, async () => {
    await db.todos.where('projectId').equals(projectId).delete();
    await db.communications.where('projectId').equals(projectId).delete();
    await db.projects.delete(projectId);
  });
}
