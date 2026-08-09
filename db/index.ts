// Initialisiert das D1-Schema und stellt den typisierten Drizzle-Zugriff bereit
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let schemaReady: Promise<void> | null = null;

const runtimeSchemaStatements = [
  'PRAGMA foreign_keys = ON',
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '' NOT NULL,
    status TEXT DEFAULT 'open' NOT NULL,
    due_date TEXT,
    due_time TEXT,
    follow_up_date TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '' NOT NULL,
    due_date TEXT,
    done INTEGER DEFAULT 0 NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    color TEXT DEFAULT '#2563eb' NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS todo_tags (
    owner_id TEXT NOT NULL,
    todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY(todo_id, tag_id)
  )`,
  `CREATE TABLE IF NOT EXISTS project_tags (
    owner_id TEXT NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY(project_id, tag_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_projects_owner_status ON projects(owner_id, status)',
  'CREATE INDEX IF NOT EXISTS idx_projects_owner_due ON projects(owner_id, due_date)',
  'CREATE INDEX IF NOT EXISTS idx_todos_owner_status ON todos(owner_id, status)',
  'CREATE INDEX IF NOT EXISTS idx_todos_owner_due ON todos(owner_id, due_date)',
  'CREATE INDEX IF NOT EXISTS idx_todos_owner_follow_up ON todos(owner_id, follow_up_date)',
  'CREATE INDEX IF NOT EXISTS idx_todos_owner_project ON todos(owner_id, project_id)',
  'CREATE INDEX IF NOT EXISTS idx_milestones_owner_project ON milestones(owner_id, project_id)',
  'CREATE INDEX IF NOT EXISTS idx_milestones_owner_due ON milestones(owner_id, due_date)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_owner_normalized_name ON tags(owner_id, normalized_name)',
  'CREATE INDEX IF NOT EXISTS idx_todo_tags_owner ON todo_tags(owner_id)',
  'CREATE INDEX IF NOT EXISTS idx_project_tags_owner ON project_tags(owner_id)',
];

function getBinding() {
  if (!env.DB) throw new Error('Die D1-Datenbank ist nicht verbunden.');
  return env.DB;
}

export async function getDb() {
  const binding = getBinding();
  schemaReady ??= binding.batch(runtimeSchemaStatements.map((statement) => binding.prepare(statement))).then(() => undefined);
  await schemaReady;
  return drizzle(binding, { schema });
}
