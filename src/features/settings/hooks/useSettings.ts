import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_SETTINGS, getSettings, type AppSettings } from '../data/settings';

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => getSettings(), []);
  return settings ?? DEFAULT_SETTINGS;
}
