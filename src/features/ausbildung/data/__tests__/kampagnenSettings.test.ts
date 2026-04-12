import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAnzuzeigendeKampagnen,
  getGespeicherteKampagnenauswahl,
  normalizeKampagnenModus,
} from '../kampagnenSettings';

describe('kampagnenSettings', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('behandelt den Legacy-Modus aktuelle als Nutzerauswahl', () => {
    expect(normalizeKampagnenModus('aktuelle')).toBe('nutzerauswahl');
    expect(normalizeKampagnenModus('nutzerauswahl')).toBe('nutzerauswahl');
    expect(normalizeKampagnenModus('alle_laufenden')).toBe('alle_laufenden');
  });

  it('liefert die gespeicherte Nutzerauswahl unverändert zurück', () => {
    const kampagnen = [
      { label: 'Mai 2025', t0Year: 2025, t0Month: 4 },
      { label: 'August 2025', t0Year: 2025, t0Month: 7 },
    ];

    expect(getGespeicherteKampagnenauswahl({ kampagnenAuswahl: kampagnen })).toEqual(kampagnen);
  });

  it('fällt ohne gespeicherte Nutzerauswahl auf die aktuelle Kampagne zurück', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-12T10:00:00Z'));

    expect(getGespeicherteKampagnenauswahl({})).toEqual([
      { label: 'Februar 2026', t0Year: 2026, t0Month: 1 },
    ]);
  });

  it('zeigt im Modus Alle laufenden weiterhin alle laufenden Kampagnen an', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-12T10:00:00Z'));

    const kampagnen = getAnzuzeigendeKampagnen({
      defaultKampagnenModus: 'alle_laufenden',
      kampagnenAuswahl: [{ label: 'Mai 2025', t0Year: 2025, t0Month: 4 }],
    });

    expect(kampagnen).toEqual([
      { label: 'Mai 2024', t0Year: 2024, t0Month: 4 },
      { label: 'August 2024', t0Year: 2024, t0Month: 7 },
      { label: 'November 2024', t0Year: 2024, t0Month: 10 },
      { label: 'Februar 2025', t0Year: 2025, t0Month: 1 },
      { label: 'Mai 2025', t0Year: 2025, t0Month: 4 },
      { label: 'August 2025', t0Year: 2025, t0Month: 7 },
      { label: 'November 2025', t0Year: 2025, t0Month: 10 },
      { label: 'Februar 2026', t0Year: 2026, t0Month: 1 },
    ]);
  });
});
