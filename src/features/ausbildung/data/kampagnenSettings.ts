import type { AppSettings, KampagnenAuswahlItem } from '../../../shared/db/db';
import { updateSettings } from '../../settings/data/settings';
import { getDefaultKampagnen } from '../lib/ausbildungsPhasen';

export type { KampagnenAuswahlItem } from '../../../shared/db/db';
export type KampagnenModus = 'nutzerauswahl' | 'alle_laufenden';
type LegacyKampagnenModus = KampagnenModus | 'aktuelle';

function isKampagnenAuswahlItem(value: unknown): value is KampagnenAuswahlItem {
  if (!value || typeof value !== 'object') return false;

  const item = value as Partial<KampagnenAuswahlItem>;
  return typeof item.label === 'string'
    && typeof item.t0Year === 'number'
    && typeof item.t0Month === 'number';
}

export function normalizeKampagnenModus(modus?: LegacyKampagnenModus): KampagnenModus {
  return modus === 'alle_laufenden' ? 'alle_laufenden' : 'nutzerauswahl';
}

export function getGespeicherteKampagnenauswahl(
  settings: Pick<AppSettings, 'kampagnenAuswahl'>,
): KampagnenAuswahlItem[] {
  const kampagnen = settings.kampagnenAuswahl?.filter(isKampagnenAuswahlItem) ?? [];
  if (kampagnen.length > 0) return kampagnen;
  return getDefaultKampagnen('aktuelle'); // 'aktuelle' = "nur aktuelle Kampagne" — der Parameterwert, nicht der Modus-Name
}

export function getAnzuzeigendeKampagnen(
  settings: Pick<AppSettings, 'defaultKampagnenModus' | 'kampagnenAuswahl'>,
): KampagnenAuswahlItem[] {
  const modus = normalizeKampagnenModus(settings.defaultKampagnenModus);
  if (modus === 'alle_laufenden') {
    return getDefaultKampagnen('alle_laufenden');
  }
  return getGespeicherteKampagnenauswahl(settings);
}

export function saveKampagnenauswahl(kampagnen: KampagnenAuswahlItem[]) {
  return updateSettings({ kampagnenAuswahl: kampagnen });
}
