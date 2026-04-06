import { exportDB, importInto } from 'dexie-export-import';
import { db, DEFAULT_SETTINGS } from '../../shared/db/db';

/** Aktuelle Schema-Version – muss mit db.ts übereinstimmen. */
const CURRENT_SCHEMA_VERSION = 4;

/**
 * Exportiert die gesamte Datenbank als JSON-Datei und löst den Browser-Download aus.
 * Fügt Metadaten (_appVersion, _exportedAt) hinzu, damit beim Import die
 * Schema-Kompatibilität geprüft werden kann.
 */
export async function exportDatabase(): Promise<boolean> {
  try {
    const blob = await exportDB(db, { prettyJson: true });
    const text = await blob.text();
    const data = JSON.parse(text);

    // Metadaten anhängen
    data._appSchemaVersion = CURRENT_SCHEMA_VERSION;
    data._exportedAt = new Date().toISOString();

    const enrichedBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(enrichedBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `workvibe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[dbBackup] Export fehlgeschlagen:', err);
    return false;
  }
}

/**
 * Importiert eine JSON-Backup-Datei und überschreibt alle lokalen Tabellen.
 * Migriert ältere Backup-Formate automatisch zur aktuellen Schema-Version,
 * sodass Backups aus früheren App-Versionen immer importiert werden können.
 *
 * Gibt ein Objekt mit `success` und optional `error` (Fehlerbeschreibung) zurück.
 */
export async function importDatabase(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: 'Die Datei enthält kein gültiges JSON.' };
    }

    // Grundlegende Struktur-Validierung (dexie-export-import Format)
    if (!data.data || typeof data.data !== 'object') {
      return { success: false, error: 'Ungültiges Backup-Format (kein dexie-export).' };
    }

    // Schema-Version des Backups ermitteln
    const backupVersion: number =
      typeof data._appSchemaVersion === 'number'
        ? data._appSchemaVersion
        : guessVersionFromData(data);

    // Backup-Daten migrieren, falls nötig
    if (backupVersion < CURRENT_SCHEMA_VERSION) {
      migrateBackupData(data, backupVersion);
    }

    // Migriertes JSON als Blob wieder einlesen
    const migratedBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    await importInto(db, migratedBlob, {
      clearTablesBeforeImport: true,
      acceptVersionDiff: true,
    });

    // Sicherstellen, dass Settings existieren (falls das Backup keine hatte)
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add(DEFAULT_SETTINGS);
    }

    return { success: true };
  } catch (err) {
    console.error('[dbBackup] Import fehlgeschlagen:', err);
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return { success: false, error: message };
  }
}

// ─── Hilfsfunktionen (exportiert für Tests) ─────────────────────────────────

/**
 * Ermittelt die wahrscheinliche Schema-Version anhand vorhandener Tabellen,
 * falls kein _appSchemaVersion-Feld im Backup existiert (ältere Exports).
 */
export function guessVersionFromData(data: Record<string, unknown>): number {
  const tables = getTableNames(data);
  if (tables.includes('milestones')) return 3;
  if (tables.includes('settings')) return 2;
  return 1;
}

/** Gibt die Tabellennamen aus dem dexie-export-Datenformat zurück. */
export function getTableNames(data: Record<string, unknown>): string[] {
  const inner = data.data as Record<string, unknown> | undefined;
  if (!inner) return [];
  const dbData = Array.isArray(inner.data) ? inner.data : [];
  return (dbData as Array<{ tableName?: string }>).map((t) => t.tableName ?? '');
}

/**
 * Migriert die Backup-JSON-Struktur von `fromVersion` auf `CURRENT_SCHEMA_VERSION`.
 * Fügt fehlende Tabellen mit leeren Daten hinzu und passt Schema-Definitionen an.
 */
export function migrateBackupData(data: Record<string, unknown>, fromVersion: number): void {
  const inner = data.data as Record<string, unknown>;
  if (!inner) return;

  const dbExport = inner.data as Array<{
    tableName: string;
    inbound: boolean;
    rows: unknown[];
  }>;

  const databasesArr = inner.tables as Array<{
    name: string;
    schema: string;
    rowCount: number;
  }> | undefined;

  // Hilfsfunktion: Tabelle hinzufügen, falls sie fehlt
  function ensureTable(name: string, schema: string) {
    const exists = dbExport.some((t) => t.tableName === name);
    if (!exists) {
      dbExport.push({ tableName: name, inbound: true, rows: [] });
    }
    if (databasesArr && !databasesArr.some((t) => t.name === name)) {
      databasesArr.push({ name, schema, rowCount: 0 });
    }
  }

  // v1 → v2: settings-Tabelle
  if (fromVersion < 2) {
    ensureTable('settings', '++id');
  }

  // v2 → v3: milestones-Tabelle
  if (fromVersion < 3) {
    ensureTable('milestones', '++id,projectId');
  }

  // v3 → v4: todos Index aktualisieren + backlog-low → backlog migrieren
  if (fromVersion < 4) {
    const todosTable = dbExport.find((t) => t.tableName === 'todos');
    if (todosTable) {
      for (const row of todosTable.rows as Array<Record<string, unknown>>) {
        if (row.status === 'backlog-low') {
          row.status = 'backlog';
        }
        // Entferne veraltete Felder, die in v4 nicht mehr indiziert werden
        delete row.startDate;
        delete row.startAfterId;
      }
    }
    // Todos-Schema im tables-Array aktualisieren
    if (databasesArr) {
      const entry = databasesArr.find((t) => t.name === 'todos');
      if (entry) {
        entry.schema = '++id,title,status,deadline,projectId,commId';
      }
    }
  }

  // DB-Version im Export auf aktuellen Stand setzen
  const dbs = inner.databaseName ? inner : inner;
  if (typeof (dbs as Record<string, unknown>).databaseVersion === 'number') {
    (dbs as Record<string, unknown>).databaseVersion = CURRENT_SCHEMA_VERSION * 10;
  }

  // Metadaten aktualisieren
  data._appSchemaVersion = CURRENT_SCHEMA_VERSION;
}
