import { describe, it, expect, vi, beforeEach } from 'vitest';
import { guessVersionFromData, getTableNames, migrateBackupData, importDatabase } from '../dbBackup';
import legacyMainUpgradeEdgeCases from '../../../../docs/test-data/backups/legacy-main-upgrade-edge-cases.json';
import legacyV1MigrationStressTest from '../../../../docs/test-data/backups/legacy-v1-migration-stress-test.json';

// Mock dexie-export-import — `importInto` nutzt FileReader/ArrayBuffer,
// die in Node.js nicht verfügbar sind. Wir testen unsere eigene Logik
// (Validierung, Migration), nicht die Dexie-Bibliothek.
vi.mock('dexie-export-import', () => ({
  exportDB: vi.fn(),
  importInto: vi.fn().mockResolvedValue(undefined),
}));

// ─── Fixture-Helpers ─────────────────────────────────────────────────────────

/** Erzeugt ein minimales Dexie-Export-Objekt mit den angegebenen Tabellen. */
function makeDexieExport(
  tableNames: string[],
  opts: {
    rows?: Record<string, Array<Record<string, unknown>>>;
    schemas?: Record<string, string>;
    databaseVersion?: number;
  } = {},
): Record<string, unknown> {
  const tables = tableNames.map((name) => ({
    name,
    schema: opts.schemas?.[name] ?? '++id',
    rowCount: opts.rows?.[name]?.length ?? 0,
  }));

  const data = tableNames.map((name) => ({
    tableName: name,
    inbound: true,
    rows: opts.rows?.[name] ?? [],
  }));

  return {
    formatName: 'dexie',
    formatVersion: 1,
    _appSchemaVersion: undefined, // bewusst leer für guessVersion-Tests
    data: {
      databaseName: 'todo-manager-db',
      databaseVersion: opts.databaseVersion ?? 10,
      tables,
      data,
    },
  };
}

// ─── getTableNames ───────────────────────────────────────────────────────────

describe('getTableNames', () => {
  it('extrahiert Tabellennamen aus gültigem Dexie-Export', () => {
    const data = makeDexieExport(['projects', 'todos', 'settings']);
    expect(getTableNames(data)).toEqual(['projects', 'todos', 'settings']);
  });

  it('gibt leeres Array bei fehlendem data-Feld zurück', () => {
    expect(getTableNames({})).toEqual([]);
  });

  it('gibt leeres Array bei leerem data.data zurück', () => {
    expect(getTableNames({ data: {} })).toEqual([]);
  });
});

// ─── guessVersionFromData ────────────────────────────────────────────────────

describe('guessVersionFromData', () => {
  it('erkennt Version 1 (nur Basistabellen)', () => {
    const data = makeDexieExport(['projects', 'persons', 'communications', 'todos']);
    expect(guessVersionFromData(data)).toBe(1);
  });

  it('erkennt Version 2 (settings vorhanden)', () => {
    const data = makeDexieExport(['projects', 'persons', 'communications', 'todos', 'settings']);
    expect(guessVersionFromData(data)).toBe(2);
  });

  it('erkennt Version 3 (milestones vorhanden)', () => {
    const data = makeDexieExport([
      'projects', 'persons', 'communications', 'todos', 'settings', 'milestones',
    ]);
    expect(guessVersionFromData(data)).toBe(3);
  });
});

// ─── migrateBackupData ───────────────────────────────────────────────────────

describe('migrateBackupData', () => {
  it('migriert v1→v4: fügt settings + milestones hinzu', () => {
    const data = makeDexieExport(
      ['projects', 'persons', 'communications', 'todos'],
      { databaseVersion: 10 },
    );

    migrateBackupData(data, 1);

    const tables = getTableNames(data);
    expect(tables).toContain('settings');
    expect(tables).toContain('milestones');
    expect(data._appSchemaVersion).toBe(4);
  });

  it('migriert v3→v4: backlog-low → backlog', () => {
    const data = makeDexieExport(
      ['projects', 'persons', 'communications', 'todos', 'settings', 'milestones'],
      {
        rows: {
          todos: [
            { id: 1, title: 'Task A', status: 'backlog-low', startDate: '2024-01-01', startAfterId: 5 },
            { id: 2, title: 'Task B', status: 'backlog' },
            { id: 3, title: 'Task C', status: 'doing' },
          ],
        },
        schemas: {
          todos: '++id,title,status,deadline,startDate,startAfterId,projectId,commId',
        },
        databaseVersion: 30,
      },
    );

    migrateBackupData(data, 3);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inner = data.data as any;
    const todosTable = inner.data.find((t: { tableName: string }) => t.tableName === 'todos');
    const rows = todosTable.rows as Array<Record<string, unknown>>;

    // backlog-low wurde zu backlog migriert
    expect(rows[0].status).toBe('backlog');
    // startDate und startAfterId wurden entfernt
    expect(rows[0]).not.toHaveProperty('startDate');
    expect(rows[0]).not.toHaveProperty('startAfterId');

    // Andere Todos bleiben unverändert
    expect(rows[1].status).toBe('backlog');
    expect(rows[2].status).toBe('doing');

    // Schema wurde aktualisiert
    const todosSchema = inner.tables.find((t: { name: string }) => t.name === 'todos');
    expect(todosSchema.schema).toBe('++id,title,status,deadline,projectId,commId');
  });

  it('migriert v2→v4: fügt milestones hinzu + migriert todos', () => {
    const data = makeDexieExport(
      ['projects', 'persons', 'communications', 'todos', 'settings'],
      {
        rows: {
          todos: [
            { id: 1, title: 'Test', status: 'backlog-low' },
          ],
        },
        databaseVersion: 20,
      },
    );

    migrateBackupData(data, 2);

    const tables = getTableNames(data);
    expect(tables).toContain('milestones');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inner = data.data as any;
    const todosTable = inner.data.find((t: { tableName: string }) => t.tableName === 'todos');
    expect(todosTable.rows[0].status).toBe('backlog');
  });

  it('aktualisiert databaseVersion auf aktuellen Stand', () => {
    const data = makeDexieExport(
      ['projects', 'persons', 'communications', 'todos'],
      { databaseVersion: 10 },
    );

    migrateBackupData(data, 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inner = data.data as any;
    expect(inner.databaseVersion).toBe(40); // CURRENT_SCHEMA_VERSION (4) * 10
  });

  it('fügt Tabellen nicht doppelt hinzu wenn sie bereits existieren', () => {
    const data = makeDexieExport(
      ['projects', 'persons', 'communications', 'todos', 'settings'],
      { databaseVersion: 20 },
    );

    migrateBackupData(data, 2);

    // settings sollte nicht doppelt vorhanden sein
    const tables = getTableNames(data);
    const settingsCount = tables.filter(t => t === 'settings').length;
    expect(settingsCount).toBe(1);
  });
});

// ─── importDatabase (Validierungslogik) ──────────────────────────────────────

describe('importDatabase', () => {
  it('lehnt ungültiges JSON ab', async () => {
    const file = new File(['not json at all {{{'], 'broken.json', { type: 'application/json' });
    const result = await importDatabase(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('kein gültiges JSON');
  });

  it('lehnt Datei ohne data-Feld ab', async () => {
    const file = new File([JSON.stringify({ foo: 'bar' })], 'invalid.json', { type: 'application/json' });
    const result = await importDatabase(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Ungültiges Backup-Format');
  });

  it('ruft importInto mit migriertem Backup auf', async () => {
    const { importInto } = await import('dexie-export-import');

    const exportData = makeDexieExport(
      ['projects', 'persons', 'communications', 'todos'],
      {
        rows: {
          projects: [{ id: 1, title: 'Test' }],
          todos: [{ id: 1, title: 'Alt', status: 'backlog-low' }],
          persons: [],
          communications: [],
        },
        databaseVersion: 10,
      },
    );

    const file = new File([JSON.stringify(exportData)], 'backup.json', { type: 'application/json' });
    const result = await importDatabase(file);

    expect(result.success).toBe(true);
    // importInto wurde mit dem migrierten Blob aufgerufen
    expect(importInto).toHaveBeenCalledTimes(1);

    // Das übergebene Blob enthält migrierte Daten
    const call = (importInto as ReturnType<typeof vi.fn>).mock.calls[0];
    const blob = call[1] as Blob;
    const text = await blob.text();
    const parsed = JSON.parse(text);

    // Migration wurde durchgeführt
    expect(parsed._appSchemaVersion).toBe(4);
    const tables = getTableNames(parsed);
    expect(tables).toContain('settings');
    expect(tables).toContain('milestones');
  });

  it('akzeptiert das main-nahe Upgrade-Backup mit fehlenden neuen settings-Feldern', async () => {
    const { importInto } = await import('dexie-export-import');
    const exportData = structuredClone(legacyMainUpgradeEdgeCases) as Record<string, unknown>;

    const file = new File([JSON.stringify(exportData)], 'legacy-main-upgrade-edge-cases.json', {
      type: 'application/json',
    });

    const result = await importDatabase(file);

    expect(result.success).toBe(true);
    expect(importInto).toHaveBeenCalledTimes(1);

    const call = (importInto as ReturnType<typeof vi.fn>).mock.calls[0];
    const blob = call[1] as Blob;
    const parsed = JSON.parse(await blob.text()) as Record<string, unknown>;

    expect(parsed._appSchemaVersion).toBe(4);
    expect(getTableNames(parsed)).toEqual([
      'projects',
      'persons',
      'communications',
      'todos',
      'settings',
      'milestones',
      'projectTemplates',
    ]);

    const inner = parsed.data as {
      data: Array<{ tableName: string; rows: Array<Record<string, unknown>> }>;
    };
    const settingsTable = inner.data.find((t) => t.tableName === 'settings');
    expect(settingsTable?.rows).toHaveLength(1);
    expect(settingsTable?.rows[0]).not.toHaveProperty('defaultKampagnenModus');
    expect(settingsTable?.rows[0]).not.toHaveProperty('honorarConfig');
  });

  it('migriert das v1-Stress-Backup auf den erwarteten v4-Importstand', async () => {
    const { importInto } = await import('dexie-export-import');
    const exportData = structuredClone(legacyV1MigrationStressTest) as Record<string, unknown>;

    expect(guessVersionFromData(exportData)).toBe(1);

    const file = new File([JSON.stringify(exportData)], 'legacy-v1-migration-stress-test.json', {
      type: 'application/json',
    });

    const result = await importDatabase(file);

    expect(result.success).toBe(true);
    expect(importInto).toHaveBeenCalledTimes(1);

    const call = (importInto as ReturnType<typeof vi.fn>).mock.calls[0];
    const blob = call[1] as Blob;
    const parsed = JSON.parse(await blob.text()) as Record<string, unknown>;

    expect(parsed._appSchemaVersion).toBe(4);

    const tables = getTableNames(parsed);
    expect(tables).toContain('settings');
    expect(tables).toContain('milestones');
    expect(tables).not.toContain('projectTemplates');

    const inner = parsed.data as {
      databaseVersion: number;
      tables: Array<{ name: string; schema: string }>;
      data: Array<{ tableName: string; rows: Array<Record<string, unknown>> }>;
    };

    expect(inner.databaseVersion).toBe(40);

    const todosSchema = inner.tables.find((t) => t.name === 'todos');
    expect(todosSchema?.schema).toBe('++id,title,status,deadline,projectId,commId');

    const todosTable = inner.data.find((t) => t.tableName === 'todos');
    expect(todosTable).toBeDefined();
    for (const row of todosTable!.rows) {
      expect(row.status).not.toBe('backlog-low');
      expect(row).not.toHaveProperty('startDate');
      expect(row).not.toHaveProperty('startAfterId');
    }

    const settingsTable = inner.data.find((t) => t.tableName === 'settings');
    const milestonesTable = inner.data.find((t) => t.tableName === 'milestones');
    expect(settingsTable?.rows).toEqual([]);
    expect(milestonesTable?.rows).toEqual([]);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });
});
