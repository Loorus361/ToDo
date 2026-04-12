// Feature-API für App-Einstellungen: Lesen und Schreiben der AppSettings in der Datenbank
import { db, DEFAULT_SETTINGS, type AppSettings } from '../../../shared/db/db';
import { saveSettings } from '../../../shared/db/db';

export { DEFAULT_SETTINGS };
export type { AppSettings } from '../../../shared/db/db';

export function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get(1);
}

export function updateSettings(partial: Partial<AppSettings>) {
  return saveSettings(partial);
}
