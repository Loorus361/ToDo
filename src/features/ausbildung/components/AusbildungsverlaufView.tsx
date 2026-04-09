import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Plus, X, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';
import {
  AUSBILDUNGS_BLOECKE,
  PHASE_COLORS,
  TOTAL_QUARTERS,
  KAMPAGNE_LABELS,
  KAMPAGNE_MONATE,
  getDefaultKampagnen,
  type StationBlock,
} from '../lib/ausbildungsPhasen';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings } from '../../settings/data/settings';

interface Kampagne {
  id: string;
  label: string;
  t0Year: number;
  t0Month: number; // 0-basiert (JS Date)
}

const STORAGE_KEY = 'ausbildung-kampagnen';
const MODUS_STORAGE_KEY = 'ausbildung-kampagnen-modus';
const LABEL_WIDTH = 120;
const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WIDTH_BY_SCALE = {
  schmal: 36,
  mittel: 48,
  breit: 64,
} as const;
type ScaleOption = keyof typeof WIDTH_BY_SCALE;

// Konvertiert (year, month) zu einem absoluten Viertelmonats-Index
function toAbsQuarter(year: number, month: number): number {
  return (year * 12 + month) * 4;
}

function getMaxLayers(blocks: StationBlock[]): number {
  return Math.max(...blocks.map(b => b.layer)) + 1;
}

function sortKampagnenByStart(items: Kampagne[]): Kampagne[] {
  return [...items].sort((a, b) => {
    const aStart = toAbsQuarter(a.t0Year, a.t0Month);
    const bStart = toAbsQuarter(b.t0Year, b.t0Month);
    if (aStart !== bStart) return aStart - bStart;
    return a.label.localeCompare(b.label);
  });
}

function loadKampagnen(modus: 'aktuelle' | 'alle_laufenden' = 'aktuelle'): Kampagne[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Kampagne[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }

  // Fallback: Default-Kampagnen anhand des Settings-Modus erzeugen
  const defaults = getDefaultKampagnen(modus);
  return defaults.map((d, i) => ({ id: `k-${i}`, ...d }));
}

function saveKampagnen(kampagnen: Kampagne[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(kampagnen));
  } catch { /* ignore */ }
}

export default function AusbildungsverlaufView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // rawSettings === undefined solange IndexedDB noch lädt; danach echte Werte
  const rawSettings = useLiveQuery(() => getSettings(), []);
  const [kampagnen, setKampagnen] = useState<Kampagne[]>(() => {
    const storedModus = sessionStorage.getItem(MODUS_STORAGE_KEY) as 'aktuelle' | 'alle_laufenden' | null;
    return loadKampagnen(storedModus ?? 'aktuelle');
  });
  const [addYear, setAddYear] = useState(new Date().getFullYear());
  const [addMonthIdx, setAddMonthIdx] = useState(0);
  const [scale, setScale] = useState<ScaleOption>('mittel');
  const [scrollLeft, setScrollLeft] = useState(0);
  const sortedKampagnen = useMemo(() => sortKampagnenByStart(kampagnen), [kampagnen]);

  // Modus aus Settings anwenden – läuft bei jedem rawSettings-Wechsel.
  // Kampagnen werden nur zurückgesetzt, wenn noch keine User-Auswahl in der Session
  // gespeichert ist (erstes Öffnen). Danach wird nur der gespeicherte Modus aktualisiert,
  // damit spätere Sessions den neuen Modus als Default nutzen – ohne aktuelle Kampagnen zu überschreiben.
  useEffect(() => {
    if (rawSettings === undefined) return;
    const modus = rawSettings.defaultKampagnenModus ?? 'aktuelle';
    const storedModus = sessionStorage.getItem(MODUS_STORAGE_KEY);
    if (storedModus !== modus) {
      const hasStoredKampagnen = sessionStorage.getItem(STORAGE_KEY) !== null;
      if (!hasStoredKampagnen) {
        setKampagnen(getDefaultKampagnen(modus).map((d, i) => ({ id: `k-${i}`, ...d })));
      }
      sessionStorage.setItem(MODUS_STORAGE_KEY, modus);
    }
  }, [rawSettings]);

  // Kampagnen in sessionStorage persistieren (nur wenn Modus bereits gesetzt)
  useEffect(() => {
    if (sessionStorage.getItem(MODUS_STORAGE_KEY) === null) return;
    saveKampagnen(kampagnen);
  }, [kampagnen]);

  // Scroll-Position für mitscrollende Labels verfolgen
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Zum aktuellen Datum scrollen wenn Kampagnen geladen oder geändert werden
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || currentQuarterOffset < 0 || currentQuarterOffset > totalQuarters) return;
    const targetScroll = currentQuarterOffset * quarterColWidth - (el.clientWidth - LABEL_WIDTH) / 2;
    el.scrollLeft = Math.max(0, targetScroll);
  }, [sortedKampagnen]); // eslint-disable-line react-hooks/exhaustive-deps

  const addKampagne = useCallback(() => {
    const m = KAMPAGNE_MONATE[addMonthIdx];
    const label = `${KAMPAGNE_LABELS[addMonthIdx]} ${addYear}`;
    setKampagnen(prev => {
      if (prev.some(k => k.t0Year === addYear && k.t0Month === m)) return prev;
      return sortKampagnenByStart([...prev, { id: `k-${Date.now()}`, label, t0Year: addYear, t0Month: m }]);
    });
  }, [addMonthIdx, addYear]);

  const removeKampagne = useCallback((id: string) => {
    setKampagnen(prev => prev.filter(k => k.id !== id));
  }, []);

  // Berechne den globalen Zeitraum (frühester Start bis spätestes Ende)
  const { globalStartQuarter, totalQuarters, months } = useMemo(() => {
    if (sortedKampagnen.length === 0) return { globalStartQuarter: 0, totalQuarters: 0, months: [] };

    let minQ = Infinity;
    let maxQ = -Infinity;
    for (const k of sortedKampagnen) {
      const kStart = toAbsQuarter(k.t0Year, k.t0Month);
      minQ = Math.min(minQ, kStart);
      maxQ = Math.max(maxQ, kStart + TOTAL_QUARTERS);
    }

    const total = maxQ - minQ;
    const totalMonths = Math.ceil(total / 4);

    const monthLabels: { label: string; absMonth: number }[] = [];
    const startAbsMonth = Math.floor(minQ / 4);
    for (let i = 0; i < totalMonths; i++) {
      const absMonth = startAbsMonth + i;
      const year = Math.floor(absMonth / 12);
      const month = absMonth % 12;
      monthLabels.push({
        label: `${MONTH_NAMES[month]} ${year}`,
        absMonth,
      });
    }

    return { globalStartQuarter: minQ, totalQuarters: total, months: monthLabels };
  }, [sortedKampagnen]);

  const quarterColWidth = WIDTH_BY_SCALE[scale];
  const totalWidth = totalQuarters * quarterColWidth;
  const layerCount = getMaxLayers(AUSBILDUNGS_BLOECKE);
  const currentAbsQuarter = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const quarterInMonth = day <= 7 ? 0 : day <= 15 ? 1 : day <= 23 ? 2 : 3;
    return (now.getFullYear() * 12 + now.getMonth()) * 4 + quarterInMonth;
  }, []);
  const currentQuarterOffset = currentAbsQuarter - globalStartQuarter;
  const showCurrentMarker = currentQuarterOffset >= 0 && currentQuarterOffset <= totalQuarters;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap size={24} className="text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Ausbildungsverlauf</h2>
        </div>

        {/* Kampagne hinzufügen */}
        <div className="flex items-center gap-2">
          <select
            value={addMonthIdx}
            onChange={e => setAddMonthIdx(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
          >
            {KAMPAGNE_LABELS.map((l, i) => (
              <option key={l} value={i}>{l}</option>
            ))}
          </select>
          <input
            type="number"
            value={addYear}
            onChange={e => setAddYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 w-20 bg-white"
            min={2020}
            max={2035}
          />
          <button
            onClick={addKampagne}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
          >
            <Plus size={14} />
            Kampagne
          </button>
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          {Object.entries(PHASE_COLORS).map(([phase, colors]) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm border"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              />
              <span className="text-xs text-gray-600 capitalize">
                {phase === 'ag' ? 'Arbeitsgemeinschaft' : phase === 'pruefung' ? 'Prüfung' : phase}
              </span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="scale-select" className="text-xs font-medium text-gray-500">Skalierung</label>
          <select
            id="scale-select"
            value={scale}
            onChange={(e) => setScale(e.target.value as ScaleOption)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700"
          >
            <option value="schmal">Schmal</option>
            <option value="mittel">Mittel</option>
            <option value="breit">Breit</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white"
      >
        {sortedKampagnen.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Füge eine Kampagne hinzu, um den Ausbildungsverlauf zu sehen.
          </div>
        ) : (
          <div className="relative" style={{ minWidth: totalWidth + LABEL_WIDTH }}>
            {showCurrentMarker ? (
              <div
                aria-label="Aktuelles Datum"
                className="absolute top-0 bottom-0 pointer-events-none z-30"
                style={{ left: LABEL_WIDTH + currentQuarterOffset * quarterColWidth }}
              >
                <div className="h-full border-l-2 border-red-500" />
              </div>
            ) : null}

            {/* Monatsheader */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
              <div className="flex" style={{ paddingLeft: LABEL_WIDTH }}>
                {months.map((m, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'text-xs text-gray-500 text-center border-r border-gray-100 flex-shrink-0 py-2 font-medium',
                      i % 2 === 0 ? 'bg-gray-50/50' : ''
                    )}
                    style={{ width: quarterColWidth * 4 }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Halbmonats-Unterteilung */}
              <div className="flex" style={{ paddingLeft: LABEL_WIDTH }}>
                {Array.from({ length: Math.ceil(totalQuarters / 2) }, (_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'text-[10px] text-gray-400 text-center border-r flex-shrink-0 py-0.5',
                      i % 2 === 0 ? 'border-gray-200' : 'border-gray-100'
                    )}
                    style={{ width: quarterColWidth * 2 }}
                  >
                    {i % 2 === 0 ? '1.–15.' : '16.–31.'}
                  </div>
                ))}
              </div>
            </div>

            {/* Kampagnen-Zeilen */}
            {sortedKampagnen.map((kampagne) => (
              <KampagneRow
                key={kampagne.id}
                kampagne={kampagne}
                globalStartQuarter={globalStartQuarter}
                totalQuarters={totalQuarters}
                layerCount={layerCount}
                quarterColWidth={quarterColWidth}
                scrollLeft={scrollLeft}
                onRemove={() => removeKampagne(kampagne.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KampagneRow({
  kampagne,
  globalStartQuarter,
  totalQuarters,
  layerCount,
  quarterColWidth,
  scrollLeft,
  onRemove,
}: {
  kampagne: Kampagne;
  globalStartQuarter: number;
  totalQuarters: number;
  layerCount: number;
  quarterColWidth: number;
  scrollLeft: number;
  onRemove: () => void;
}) {
  const [hoveredBlock, setHoveredBlock] = useState<StationBlock | null>(null);
  const kampagneStartQuarter = toAbsQuarter(kampagne.t0Year, kampagne.t0Month);
  const offsetQuarters = kampagneStartQuarter - globalStartQuarter;

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="flex">
        {/* Label */}
        <div
          className="flex-shrink-0 sticky left-0 z-40 bg-white border-r border-gray-200 px-3 py-2"
          style={{ width: LABEL_WIDTH }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{kampagne.label}</div>
            </div>
            <button
              onClick={onRemove}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title="Kampagne entfernen"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Blöcke */}
        <div className="relative flex-1" style={{ height: layerCount * 32 + 8 }}>
          {/* Viertelmonats-Gitter */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalQuarters }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  'border-r flex-shrink-0 h-full',
                  i % 2 === 0 ? 'border-gray-200 bg-gray-50/30' : 'border-gray-100'
                )}
                style={{ width: quarterColWidth }}
              />
            ))}
          </div>

          {/* Station-Blöcke (verschoben um Kampagne-Offset) */}
          {AUSBILDUNGS_BLOECKE.map((block, idx) => {
            const colors = PHASE_COLORS[block.phase];
            const left = (offsetQuarters + block.startQuarter) * quarterColWidth;
            const width = (block.endQuarter - block.startQuarter) * quarterColWidth;
            const top = block.layer * 32 + 4;
            const isHovered = hoveredBlock === block;

            // Absolutes Datum für Tooltip berechnen (via Date-Objekt für korrekten Überlauf)
            const startDate = new Date(kampagne.t0Year, kampagne.t0Month + Math.floor(block.startQuarter / 4), 1);
            const endDate = new Date(kampagne.t0Year, kampagne.t0Month + Math.floor((block.endQuarter - 1) / 4), 1);

            const tooltip = `${block.label}\n${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()} – ${MONTH_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`;

            // Label mitscrollen: Offset berechnen, damit der Text im sichtbaren Teil des Blocks bleibt
            const hiddenLeft = Math.max(0, scrollLeft - left);
            const labelOffset = Math.min(hiddenLeft, Math.max(0, width - 40));

            return (
              <div
                key={idx}
                className="absolute rounded-md border text-xs font-medium px-1.5 flex items-center cursor-default transition-shadow overflow-hidden"
                style={{
                  left,
                  width,
                  top,
                  height: 26,
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  zIndex: isHovered ? 30 : 10,
                  boxShadow: isHovered ? `0 2px 8px ${colors.border}40` : 'none',
                }}
                onMouseEnter={() => setHoveredBlock(block)}
                onMouseLeave={() => setHoveredBlock(null)}
                title={tooltip}
              >
                <span className="whitespace-nowrap" style={{ transform: `translateX(${labelOffset}px)` }}>{block.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
