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
  status: 'today' | 'backlog' | 'doing' | 'done' | 'archived';
  description?: string;
  deadline?: string;
  prio?: boolean;
  projectId?: number;
  commId?: number;
  lastAutoScheduledDate?: string; // 'YYYY-MM-DD' – verhindert tägliche Re-Einplanung
  completedAt?: string;           // 'YYYY-MM-DD' – gesetzt wenn status → 'done'
}

export interface Milestone {
  id?: number;
  title: string;
  done: boolean;
  notes?: string;
  projectId: number;
  order?: number;
}

/** Vergütungssätze in EUR */
export interface HonorarRates {
  doppelstunde: number;
  klausur: number;
  klkuKlausur: number;
  ueberarbeitungInternet: number;
  besprechungInternet: number;
  ueberarbeitungAVL: number;
  besichtigung: number;
}

/** DS-basiert oder Pauschale */
export type BillingTypePreset =
  | { kind: 'ds'; id: string; label: string; dsCount: number; klausurCount: number; klausurRateKey: 'klausur' | 'klkuKlausur' }
  | { kind: 'flat'; id: string; label: string; rateKey: keyof HonorarRates };

export interface HonorarConfig {
  rates: HonorarRates;
  presets: BillingTypePreset[];
}

export interface AppSettings {
  id?: number;
  deadlineRedDays: number;
  deadlineYellowDays: number;
  accentColor?: string;           // 'blue'|'indigo'|'emerald'|'rose'|'amber'
  bgStyle?: string;               // 'light'|'warm'|'slate'
  defaultTodoStatus?: 'backlog' | 'doing';
  lastAutoArchivedDate?: string;  // 'YYYY-MM-DD' – verhindert mehrfaches Auto-Archivieren am selben Tag
  defaultKampagnenModus?: 'aktuelle' | 'alle_laufenden';
  honorarConfig?: HonorarConfig;
}

// ─── Projekt-Templates ────────────────────────────────────────────────────────

export interface TemplateTodoItem {
  title: string;
  status: 'backlog' | 'doing' | 'today';
  description?: string;
  prio?: boolean;
}

export interface TemplateMilestoneItem {
  title: string;
  notes?: string;
}

export interface ProjectTemplate {
  id?: number;
  name: string;
  description?: string;
  todos?: TemplateTodoItem[];
  milestones?: TemplateMilestoneItem[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  deadlineRedDays: 0,
  deadlineYellowDays: 7,
  accentColor: 'blue',
  bgStyle: 'light',
  defaultTodoStatus: 'backlog',
  defaultKampagnenModus: 'aktuelle',
};

// ─── DB-Klasse ────────────────────────────────────────────────────────────────

class AppDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  persons!: EntityTable<Person, 'id'>;
  communications!: EntityTable<Communication, 'id'>;
  todos!: EntityTable<Todo, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  milestones!: EntityTable<Milestone, 'id'>;
  projectTemplates!: EntityTable<ProjectTemplate, 'id'>;

  constructor() {
    super('todo-manager-db');

    this.version(1).stores({
      projects: '++id, title, deadline',
      persons: '++id, name',
      communications: '++id, type, medium, timestamp, content, personId, projectId, generatedTodoId',
      todos: '++id, title, status, deadline, startDate, startAfterId, projectId, commId',
    });

    // Version 2: settings-Tabelle hinzugefügt
    this.version(2).stores({
      settings: '++id',
    });

    // Version 3: milestones-Tabelle hinzugefügt
    this.version(3).stores({
      milestones: '++id, projectId',
    });

    // Version 4: startDate/startAfterId aus Index entfernt; backlog-low → backlog migriert
    this.version(4).stores({
      todos: '++id, title, status, deadline, projectId, commId',
    }).upgrade(async (tx) => {
      await tx.table('todos')
        .where('status').equals('backlog-low')
        .modify({ status: 'backlog' });
    });

    // Version 5: projectTemplates-Tabelle; completedAt-Index für Todos
    this.version(5).stores({
      todos: '++id, title, status, deadline, projectId, commId, completedAt',
      projectTemplates: '++id, name',
    });

    // Dirty-Hooks
    const tables = [this.projects, this.persons, this.communications, this.todos, this.settings, this.milestones, this.projectTemplates] as Dexie.Table[];
    for (const table of tables) {
      table.hook('creating', () => markDirty());
      table.hook('updating', () => markDirty());
      table.hook('deleting', () => markDirty());
    }

    // completedAt automatisch setzen/löschen wenn sich der Status ändert
    this.todos.hook('updating', (modifications) => {
      if ('status' in modifications) {
        if (modifications.status === 'done') {
          (modifications as Partial<Todo>).completedAt = new Date().toISOString().split('T')[0];
        } else {
          (modifications as Partial<Todo>).completedAt = undefined;
        }
      }
    });

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

// Archiviert erledigte Todos automatisch, sobald completedAt mindestens 1 Tag zurückliegt.
// Läuft einmal täglich ab 5:00 Uhr (geprüft beim App-Start).
export async function autoArchiveDoneTodos(): Promise<void> {
  const now = new Date();
  // Nur ab 5:00 Uhr ausführen
  if (now.getHours() < 5) return;

  const todayStr = now.toISOString().split('T')[0];
  const existing = await db.settings.get(1);
  if (existing?.lastAutoArchivedDate === todayStr) return;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  await db.todos
    .where('status').equals('done')
    .and((t) => t.completedAt != null && t.completedAt <= yesterdayStr)
    .modify({ status: 'archived' });

  await saveSettings({ lastAutoArchivedDate: todayStr });
}

// Verschiebt fällige Backlog-Todos automatisch in "Heute zur Bearbeitung".
// Wird beim App-Start und beim Klick auf "Aktualisieren" aufgerufen.
export async function autoScheduleTodayTodos(): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  await db.todos
    .where('status').equals('backlog')
    .and((t) => t.deadline != null && t.deadline <= todayStr && t.lastAutoScheduledDate !== todayStr)
    .modify({ status: 'today', lastAutoScheduledDate: todayStr });
}
