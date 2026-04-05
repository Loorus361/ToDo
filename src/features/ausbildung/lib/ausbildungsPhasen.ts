export interface StationBlock {
  label: string;
  phase: string;
  startHalf: number; // 0-basiert, in Viertelmonaten ab T0
  endHalf: number;
  type: 'abschnitt' | 'station' | 'ag' | 'klku' | 'pruefung' ;
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
  { label: 'ELZ',       phase: 'zivilrecht', startHalf: 0,  endHalf: 4,  type: 'ag', layer: 1 },
  { label: 'PZ',       phase: 'zivilrecht', startHalf: 4,  endHalf: 16,  type: 'ag', layer: 1 },
  { label: 'Zivilgericht (AG oder LG)',       phase: 'zivilrecht', startHalf: 4,  endHalf: 16,  type: 'station', layer: 0 },

  // Phase 2 – Strafrecht
  { label: 'ELS',       phase: 'strafrecht', startHalf: 16,  endHalf: 18,  type: 'ag', layer: 1 },
  { label: 'PS',        phase: 'strafrecht', startHalf: 18,  endHalf: 30, type: 'ag',  layer: 1 },
  { label: 'Staatsanwaltschaft',       phase: 'strafrecht', startHalf: 18,  endHalf: 30,  type: 'station', layer: 0 },

  // Phase 3 – Verwaltungsrecht
  { label: 'ELV',       phase: 'verwaltung', startHalf: 30,  endHalf: 32,  type: 'ag', layer: 1 },
  { label: 'PV',        phase: 'verwaltung', startHalf: 32,  endHalf: 44, type: 'ag',  layer: 1 },
  { label: 'Behörde',       phase: 'verwaltung', startHalf: 32,  endHalf: 44,  type: 'station', layer: 0 },

  // Phase 4 – Anwaltsstation
  { label: 'ELZ',           phase: 'anwalt',  startHalf: 44,  endHalf: 45,  type: 'ag',         layer: 1 },
  { label: 'RAZ',           phase: 'anwalt',  startHalf: 45,  endHalf: 50,  type: 'ag',         layer: 1 },
  { label: 'ELS',           phase: 'anwalt',  startHalf: 50,  endHalf: 51,  type: 'ag',         layer: 1 },
  { label: 'RAS',           phase: 'anwalt',  startHalf: 51,  endHalf: 58,  type: 'ag',         layer: 1 },
  { label: 'ELV',           phase: 'anwalt',  startHalf: 58,  endHalf: 59,  type: 'ag',         layer: 1 },
  { label: 'RAV',           phase: 'anwalt',  startHalf: 59,  endHalf: 64,  type: 'ag',         layer: 1 },
  { label: 'Rechtsanwalt u.a.',       phase: 'anwalt', startHalf: 44,  endHalf: 80,  type: 'station', layer: 0 },

  // Phase 5 - Pflicht Klausurenkurs
  { label: 'KlKu',            phase: 'ag',  startHalf: 64,  endHalf: 76,  type: 'klku',       layer: 1 },
  { label: 'I ',              phase: 'ag',  startHalf: 64,  endHalf: 66,  type: 'klku',       layer: 2 },
  { label: 'Besprechung I ',  phase: 'ag',  startHalf: 66,  endHalf: 68,  type: 'klku',       layer: 2 },
  { label: 'II ',             phase: 'ag',  startHalf: 68,  endHalf: 70,  type: 'klku',       layer: 2 },
  { label: 'Besprechung II ', phase: 'ag',  startHalf: 70,  endHalf: 76,  type: 'klku',       layer: 2 },

  // Schriftliches Examen (Monat 20)
  { label: 'Schriftl. Examen',    phase: 'pruefung',   startHalf: 76, endHalf: 78, type: 'pruefung', layer: 1 },

  // Phase 6 – Wahlstation
  { label: 'Wahlstation', phase: 'wahlstation', startHalf: 80,  endHalf: 96,  type: 'station',  layer: 0 }, 
  { label: 'AVL',         phase: 'ag',    startHalf: 92,  endHalf: 96,  type: 'klku',       layer: 1 },

  // Phase 7 – Mündliche Prüfung
  { label: 'Mündl. Examen',      phase: 'pruefung',   startHalf: 96, endHalf: 100, type: 'pruefung', layer: 1 },
];

export const KAMPAGNE_MONATE = [1, 4, 7, 10] as const; // Feb=1(0-idx), Mai=4, Aug=7, Nov=10
export const KAMPAGNE_LABELS = ['Februar', 'Mai', 'August', 'November'] as const;

export const TOTAL_HALF_MONTHS = 100; // 25 Monate × 4

export function getMonthLabel(t0Year: number, t0Month: number, halfIndex: number): string {
  const monthOffset = Math.floor(halfIndex / 4);
  const date = new Date(t0Year, t0Month + monthOffset, 1);
  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function getDefaultKampagnen(): { label: string; t0Year: number; t0Month: number }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Finde die nächste und vorherige Kampagne
  const starts = [
    { label: `Feb ${year}`, t0Year: year, t0Month: 1 },
    { label: `Mai ${year}`, t0Year: year, t0Month: 4 },
    { label: `Aug ${year}`, t0Year: year, t0Month: 7 },
    { label: `Nov ${year}`, t0Year: year, t0Month: 10 },
    { label: `Feb ${year + 1}`, t0Year: year + 1, t0Month: 1 },
  ];

  // Aktuelle oder letzte Kampagne finden
  const current = starts.filter(s => s.t0Year < year || (s.t0Year === year && s.t0Month <= month));
  return current.length > 0 ? [current[current.length - 1]] : [starts[0]];
}
