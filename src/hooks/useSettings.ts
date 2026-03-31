import { useLiveQuery } from 'dexie-react-hooks';
import { db, type AppSettings, DEFAULT_SETTINGS } from '../db/db';

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  return settings ?? DEFAULT_SETTINGS;
}
