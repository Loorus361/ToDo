// Prüft Dauer, Prüfungszuordnung und Blockfolge des optionalen EZSV-Verlaufs
import { describe, expect, it } from 'vitest';
import {
  EZSV_AUSBILDUNGS_BLOECKE,
  EZSV_TOTAL_QUARTERS,
  getKampagnenLabelAtOffset,
} from '../ausbildungsPhasen';

describe('EZSV-Ausbildungsverlauf', () => {
  it('beginnt nach dem AVL und dauert vier Monate', () => {
    const ezsv = EZSV_AUSBILDUNGS_BLOECKE.find((block) => block.label === 'EZSV');

    expect(ezsv).toMatchObject({
      startQuarter: 96,
      endQuarter: 112,
      layer: 0,
      phase: 'ezsv',
    });
    expect(EZSV_TOTAL_QUARTERS).toBe(124);
  });

  it('behält die Originalprüfungen und ergänzt die späteren Prüfungen als schraffierten EZSV-Pfad', () => {
    const exams = EZSV_AUSBILDUNGS_BLOECKE.filter((block) => block.type === 'pruefung');

    expect(exams).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Schriftl. Examen', startQuarter: 76, phase: 'pruefung' }),
      expect.objectContaining({ label: 'Mündl. Examen', startQuarter: 96, phase: 'pruefung' }),
      expect.objectContaining({ label: 'Wdh. schriftl. Examen', startQuarter: 112, phase: 'ezsv', examCampaignOffsetMonths: 9, hatched: true }),
      expect.objectContaining({ label: 'Mündl. Examen', startQuarter: 120, phase: 'ezsv', examCampaignOffsetMonths: 6, hatched: true }),
    ]));
  });

  it('ordnet der Kampagne August 2024 die genannten Prüfungskampagnen zu', () => {
    expect(getKampagnenLabelAtOffset(2024, 7, 9)).toBe('Mai 2025');
    expect(getKampagnenLabelAtOffset(2024, 7, 6)).toBe('Februar 2025');
  });
});
