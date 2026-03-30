import { exportDB, importInto } from 'dexie-export-import';
import { db } from '../db/db';

/**
 * Exportiert die gesamte Datenbank als JSON-Datei und löst den Browser-Download aus.
 * Gibt `true` zurück, wenn der Export erfolgreich war.
 */
export async function exportDatabase(): Promise<boolean> {
  try {
    const blob = await exportDB(db, { prettyJson: true });
    const url = URL.createObjectURL(blob);
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
 * Die Bestätigung muss vor dem Aufruf eingeholt worden sein.
 */
export async function importDatabase(file: File): Promise<boolean> {
  try {
    await importInto(db, file, { clearTablesBeforeImport: true });
    return true;
  } catch (err) {
    console.error('[dbBackup] Import fehlgeschlagen:', err);
    return false;
  }
}
