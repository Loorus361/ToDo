export interface StationBlock {
  label: string;
  phase: string;
  startQuarter: number; // 0-basiert, in Viertelmonaten ab T0
  endQuarter: number;
  type: 'abschnitt' | 'station' | 'ag' | 'klku' | 'pruefung';
  layer: number; // 0 = Hauptlayer, 1+ = überlagernde Layer
}

// Farben pro Phase
export const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  zivilrecht:      { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
  strafrecht:      { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
  verwaltung:      { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' },
  anwalt:          { bg: '#ffedd5', border: '#ea580c', text: '#9a3412' },
  wahlstation:     { bg: '#f3e8ff', border: '#9333ea', text: '#6b21a8' },
  pruefung:        { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e' },
  ag:              { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
};

// Viertelmonat-Konvention: Monat 1 = 0..3, Monat 2 = 4..7, ...
// Monat M erstes Viertel = (M-1)*4

export const AUSBILDUNGS_BLOECKE: StationBlock[] = [
  // Phase 1 – Zivilrecht
  { label: 'ELZ',                    phase: 'zivilrecht', startQuarter: 0,  endQuarter: 4,  type: 'ag',      layer: 1 },
  { label: 'PZ',                     phase: 'zivilrecht', startQuarter: 4,  endQuarter: 16, type: 'ag',      layer: 1 },
  { label: 'Zivilgericht (AG oder LG)', phase: 'zivilrecht', startQuarter: 4,  endQuarter: 16, type: 'station', layer: 0 },

  // Phase 2 – Strafrecht
  { label: 'ELS',                    phase: 'strafrecht', startQuarter: 16, endQuarter: 18, type: 'ag',      layer: 1 },
  { label: 'PS',                     phase: 'strafrecht', startQuarter: 18, endQuarter: 30, type: 'ag',      layer: 1 },
  { label: 'Staatsanwaltschaft',     phase: 'strafrecht', startQuarter: 18, endQuarter: 30, type: 'station', layer: 0 },

  // Phase 3 – Verwaltungsrecht
  { label: 'ELV',                    phase: 'verwaltung', startQuarter: 30, endQuarter: 32, type: 'ag',      layer: 1 },
  { label: 'PV',                     phase: 'verwaltung', startQuarter: 32, endQuarter: 44, type: 'ag',      layer: 1 },
  { label: 'Behörde',               phase: 'verwaltung', startQuarter: 32, endQuarter: 44, type: 'station', layer: 0 },

  // Phase 4 – Anwaltsstation
  { label: 'ELZ',                    phase: 'anwalt', startQuarter: 44, endQuarter: 45, type: 'ag',      layer: 1 },
  { label: 'RAZ',                    phase: 'anwalt', startQuarter: 45, endQuarter: 50, type: 'ag',      layer: 1 },
  { label: 'ELS',                    phase: 'anwalt', startQuarter: 50, endQuarter: 51, type: 'ag',      layer: 1 },
  { label: 'RAS',                    phase: 'anwalt', startQuarter: 51, endQuarter: 58, type: 'ag',      layer: 1 },
  { label: 'ELV',                    phase: 'anwalt', startQuarter: 58, endQuarter: 59, type: 'ag',      layer: 1 },
  { label: 'RAV',                    phase: 'anwalt', startQuarter: 59, endQuarter: 64, type: 'ag',      layer: 1 },
  { label: 'Rechtsanwalt u.a.',      phase: 'anwalt', startQuarter: 44, endQuarter: 80, type: 'station', layer: 0 },

  // Phase 5 – Pflicht Klausurenkurs
  { label: 'KlKu',                  phase: 'ag', startQuarter: 64, endQuarter: 76, type: 'klku', layer: 1 },
  { label: 'I',                     phase: 'ag', startQuarter: 64, endQuarter: 66, type: 'klku', layer: 2 },
  { label: 'Besprechung I',         phase: 'ag', startQuarter: 66, endQuarter: 68, type: 'klku', layer: 2 },
  { label: 'II',                    phase: 'ag', startQuarter: 68, endQuarter: 70, type: 'klku', layer: 2 },
  { label: 'Besprechung II',        phase: 'ag', startQuarter: 70, endQuarter: 76, type: 'klku', layer: 2 },

  // Schriftliches Examen (Monat 20)
  { label: 'Schriftl. Examen',      phase: 'pruefung', startQuarter: 76, endQuarter: 78, type: 'pruefung', layer: 1 },

  // Phase 6 – Wahlstation
  { label: 'Wahlstation',           phase: 'wahlstation', startQuarter: 80, endQuarter: 96, type: 'station', layer: 0 },
  { label: 'AVL',                   phase: 'ag',          startQuarter: 92, endQuarter: 96, type: 'klku',    layer: 1 },

  // Phase 7 – Mündliche Prüfung
  { label: 'Mündl. Examen',         phase: 'pruefung', startQuarter: 96, endQuarter: 100, type: 'pruefung', layer: 1 },
];

export const KAMPAGNE_MONATE = [1, 4, 7, 10] as const; // Feb=1(0-idx), Mai=4, Aug=7, Nov=10
export const KAMPAGNE_LABELS = ['Februar', 'Mai', 'August', 'November'] as const;

export const TOTAL_QUARTERS = 100; // 25 Monate × 4

export function getDefaultKampagnen(): { label: string; t0Year: number; t0Month: number }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const starts = [
    { label: `Februar ${year}`, t0Year: year, t0Month: 1 },
    { label: `Mai ${year}`, t0Year: year, t0Month: 4 },
    { label: `August ${year}`, t0Year: year, t0Month: 7 },
    { label: `November ${year}`, t0Year: year, t0Month: 10 },
    { label: `Februar ${year + 1}`, t0Year: year + 1, t0Month: 1 },
  ];

  // Aktuelle oder letzte Kampagne finden
  const current = starts.filter(s => s.t0Year < year || (s.t0Year === year && s.t0Month <= month));
  return current.length > 0 ? [current[current.length - 1]] : [starts[0]];
}
