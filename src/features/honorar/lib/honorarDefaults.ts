import type { AppSettings, HonorarConfig, HonorarRates, BillingTypePreset } from '../../../shared/db/db';

export const DEFAULT_HONORAR_RATES: HonorarRates = {
  doppelstunde: 92,
  klausur: 20,
  klkuKlausur: 22,
  ueberarbeitungInternet: 184,
  besprechungInternet: 92,
  ueberarbeitungAVL: 100,
  besichtigung: 92,
};

export const DEFAULT_BILLING_PRESETS: BillingTypePreset[] = [
  // DS-basierte AG-Typen (normale Klausur-Rate)
  { kind: 'ds', id: 'elz',    label: 'ELZ',    dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'pz',     label: 'PZ',     dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'els',    label: 'ELS',    dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'ps',     label: 'PS',     dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'elv',    label: 'ELV',    dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'pv',     label: 'PV',     dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'ezsv',   label: 'EZSV',   dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  // KlKU nutzt eigene Klausur-Rate
  { kind: 'ds', id: 'klku',   label: 'KlKU',   dsCount: 9, klausurCount: 0, klausurRateKey: 'klkuKlausur' },
  // RA-Phasen
  { kind: 'ds', id: 'el-raz', label: 'EL-RAZ', dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'raz',    label: 'RAZ',    dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'el-ras', label: 'EL-RAS', dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'ras',    label: 'RAS',    dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'el-rav', label: 'EL-RAV', dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  { kind: 'ds', id: 'rav',    label: 'RAV',    dsCount: 9, klausurCount: 0, klausurRateKey: 'klausur' },
  // Pauschale Positionen
  { kind: 'flat', id: 'ueberarbeitung-internet', label: 'Überarbeitung Internet-Klausur', rateKey: 'ueberarbeitungInternet' },
  { kind: 'flat', id: 'besprechung-internet',    label: 'Besprechung Internet-Klausur',   rateKey: 'besprechungInternet' },
  { kind: 'flat', id: 'ueberarbeitung-avl',      label: 'Überarbeitung Internet-AVL',     rateKey: 'ueberarbeitungAVL' },
  { kind: 'flat', id: 'besichtigung',            label: 'Besichtigung',                   rateKey: 'besichtigung' },
];

export const DEFAULT_HONORAR_CONFIG: HonorarConfig = {
  rates: DEFAULT_HONORAR_RATES,
  presets: DEFAULT_BILLING_PRESETS,
};

export function getHonorarConfig(settings: AppSettings): HonorarConfig {
  return settings.honorarConfig ?? DEFAULT_HONORAR_CONFIG;
}

export function calculateFee(
  preset: BillingTypePreset,
  rates: HonorarRates,
  overrides?: { dsCount?: number; klausurCount?: number },
): number {
  if (preset.kind === 'flat') {
    return rates[preset.rateKey];
  }
  const ds = overrides?.dsCount ?? preset.dsCount;
  const kl = overrides?.klausurCount ?? preset.klausurCount;
  return ds * rates.doppelstunde + kl * rates[preset.klausurRateKey];
}
