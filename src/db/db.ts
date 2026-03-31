import Dexie, { type EntityTable } from 'dexie';

// ─── Dirty-Tracking ───────────────────────────────────────────────────────────
let _onDirty: (() => void) | null = null;
export function registerDirtyCallback(cb: () => void): void { _onDirty = cb; }
function markDirty(): void { _onDirty?.(); }

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Project {
  id?: number;
  title: string;
  deadline?: string;
  color?: string; // Color-ID, z. B. 'blue', 'green' – siehe projectColors.ts
}

export interface Person {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  groups?: string[]; // z. B. ['ZR', 'SR']
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
  status: 'backlog' | 'backlog-low' | 'doing' | 'done' | 'archived';
  description?: string;
  deadline?: string;
  startDate?: string;
  startAfterId?: number;
  projectId?: number;
  commId?: number;
}

export interface Milestone {
  id?: number;
  title: string;
  done: boolean;
  notes?: string;
  projectId: number;
  order?: number;
}

export interface AppSettings {
  id?: number;
  deadlineRedDays: number;    // Fälligkeit <= heute + N Tage → rot
  deadlineYellowDays: number; // Fälligkeit <= heute + N Tage → gelb
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  deadlineRedDays: 0,
  deadlineYellowDays: 7,
};

// ─── DB-Klasse ────────────────────────────────────────────────────────────────

class AppDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  persons!: EntityTable<Person, 'id'>;
  communications!: EntityTable<Communication, 'id'>;
  todos!: EntityTable<Todo, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  milestones!: EntityTable<Milestone, 'id'>;

  constructor() {
    super('todo-manager-db');

    this.version(1).stores({
      projects: '++id, title, deadline',
      persons: '++id, name',
      communications: '++id, type, medium, timestamp, content, personId, projectId, generatedTodoId',
      todos: '++id, title, status, deadline, startDate, startAfterId, projectId, commId',
    });

    // Version 2: settings-Tabelle hinzugefügt (neue Felder in Project/Person sind unindexiert → kein Bump nötig)
    this.version(2).stores({
      settings: '++id',
    });

    // Version 3: milestones-Tabelle hinzugefügt
    this.version(3).stores({
      milestones: '++id, projectId',
    });

    // Dirty-Hooks
    const tables = [this.projects, this.persons, this.communications, this.todos, this.settings, this.milestones] as Dexie.Table[];
    for (const table of tables) {
      table.hook('creating', () => markDirty());
      table.hook('updating', () => markDirty());
      table.hook('deleting', () => markDirty());
    }

    // Default-Einstellungen beim ersten Start anlegen
    this.on('ready', async () => {
      const count = await this.settings.count();
      if (count === 0) {
        await this.settings.add(DEFAULT_SETTINGS);
      }
    });
  }
}

export const db = new AppDB();

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function deleteProjectCascade(projectId: number): Promise<void> {
  await db.transaction('rw', db.projects, db.todos, db.communications, db.milestones, async () => {
    await db.todos.where('projectId').equals(projectId).delete();
    await db.communications.where('projectId').equals(projectId).delete();
    await db.milestones.where('projectId').equals(projectId).delete();
    await db.projects.delete(projectId);
  });
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  const existing = await db.settings.get(1);
  await db.settings.put({ ...DEFAULT_SETTINGS, ...existing, ...partial, id: 1 });
}
