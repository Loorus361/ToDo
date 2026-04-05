export interface StationBlock {
  label: string;
  phase: string;
  startHalf: number; // 0-basiert, in Halbmonaten ab T0 (0 = erste Hälfte Monat 1)
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

// Halbmonat-Konvention: Monat 1 erste Hälfte = 0, Monat 1 zweite Hälfte = 1, Monat 2 erste = 2, ...
// Monat M erste Hälfte = (M-1)*2, zweite Hälfte = (M-1)*2 + 1

export const AUSBILDUNGS_BLOECKE: StationBlock[] = [
  // Phase 1 – Zivilrecht
  { label: 'ELZ',       phase: 'zivilrecht', startHalf: 0,  endHalf: 2,  type: 'ag', layer: 1 },
  { label: 'PZ',       phase: 'zivilrecht', startHalf: 2,  endHalf: 8,  type: 'ag', layer: 1 },
  { label: 'Zivilgericht (AG oder LG)',       phase: 'zivilrecht', startHalf: 2,  endHalf: 8,  type: 'station', layer: 0 },

  // Phase 2 – Strafrecht
  { label: 'ELS',       phase: 'strafrecht', startHalf: 8,  endHalf: 9,  type: 'ag', layer: 1 },
  { label: 'PS',        phase: 'strafrecht', startHalf: 9,  endHalf: 15, type: 'ag',  layer: 1 },
  { label: 'Staatsanwaltschaft',       phase: 'strafrecht', startHalf: 9,  endHalf: 15,  type: 'station', layer: 0 },

  // Phase 3 – Verwaltungsrecht
  { label: 'ELV',       phase: 'verwaltung', startHalf: 15,  endHalf: 16,  type: 'ag', layer: 1 },
  { label: 'PV',        phase: 'verwaltung', startHalf: 16,  endHalf: 22, type: 'ag',  layer: 1 },
  { label: 'Behörde',       phase: 'verwaltung', startHalf: 16,  endHalf: 22,  type: 'station', layer: 0 },


  // Phase 4 – Anwaltsstation
  { label: 'ELZ',           phase: 'anwalt',  startHalf: 22,  endHalf: 23,  type: 'ag',         layer: 1 },
  { label: 'RAZ',           phase: 'anwalt',  startHalf: 23,  endHalf: 25,  type: 'ag',         layer: 1 },
  { label: 'ELS',           phase: 'anwalt',  startHalf: 25,  endHalf: 26,  type: 'ag',         layer: 1 },
  { label: 'RAS',           phase: 'anwalt',  startHalf: 26,  endHalf: 29,  type: 'ag',         layer: 1 },
  { label: 'ELV',           phase: 'anwalt',  startHalf: 29,  endHalf: 30,  type: 'ag',         layer: 1 },
  { label: 'RAV',           phase: 'anwalt',  startHalf: 30,  endHalf: 32,  type: 'ag',         layer: 1 },
  { label: 'KlKu',          phase: 'pruefung',startHalf: 32,  endHalf: 38,  type: 'klku',       layer: 1 },
  // ggf. den type abschnitt entfernen. AGs inkl. KlKu in Layer 0, in Layer 1 könnten dann die KLausuren und Besprechungen vom KlKu rein
  { label: 'Rechtsanwalt u.a.',       phase: 'anwalt', startHalf: 22,  endHalf: 40,  type: 'station', layer: 0 },

  // Schriftliches Examen (Monat 20)
  { label: 'Schriftl. Examen',    phase: 'pruefung',   startHalf: 38, endHalf: 39, type: 'pruefung', layer: 1 },

  // Phase 6 – Wahlstation
  { label: 'Wahlstation', phase: 'wahlstation', startHalf: 40,  endHalf: 48,  type: 'station',  layer: 0 }, 
  { label: 'AVL',         phase: 'pruefung',    startHalf: 46,  endHalf: 48,  type: 'klku',       layer: 1 },

  // Phase 7 – Mündliche Prüfung
  { label: 'Mündl. Examen',      phase: 'pruefung',   startHalf: 48, endHalf: 50, type: 'pruefung', layer: 1 },
];

export const KAMPAGNE_MONATE = [1, 4, 7, 10] as const; // Feb=1(0-idx), Mai=4, Aug=7, Nov=10
export const KAMPAGNE_LABELS = ['Februar', 'Mai', 'August', 'November'] as const;

export const TOTAL_HALF_MONTHS = 50; // 25 Monate × 2

export function getMonthLabel(t0Year: number, t0Month: number, halfIndex: number): string {
  const monthOffset = Math.floor(halfIndex / 2);
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
