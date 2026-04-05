import { useState, useRef, useMemo } from 'react';
import { Plus, X, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';
import {
  AUSBILDUNGS_BLOECKE,
  PHASE_COLORS,
  TOTAL_HALF_MONTHS,
  KAMPAGNE_LABELS,
  KAMPAGNE_MONATE,
  type StationBlock,
} from '../lib/ausbildungsPhasen';

interface Kampagne {
  id: string;
  label: string;
  t0Year: number;
  t0Month: number; // 0-basiert (JS Date)
}

const HALF_COL_WIDTH = 48; // px pro Monatsviertel
const LABEL_WIDTH = 120;
const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Konvertiert (year, month) zu einem absoluten Viertelmonats-Index
function toAbsHalf(year: number, month: number): number {
  return (year * 12 + month) * 4;
}

function getMaxLayers(blocks: StationBlock[]): number {
  return Math.max(...blocks.map(b => b.layer)) + 1;
}

export default function AusbildungsverlaufView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [kampagnen, setKampagnen] = useState<Kampagne[]>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    // Finde aktuelle/letzte Kampagne
    const starts = [1, 4, 7, 10]; // Feb, Mai, Aug, Nov (0-basiert)
    const past = starts.filter(s => s <= m);
    const t0Month = past.length > 0 ? past[past.length - 1] : 10;
    const t0Year = past.length > 0 ? y : y - 1;
    const idx = starts.indexOf(t0Month);
    return [{
      id: 'k-0',
      label: `${KAMPAGNE_LABELS[idx]} ${t0Year}`,
      t0Year,
      t0Month,
    }];
  });
  const [addYear, setAddYear] = useState(new Date().getFullYear());
  const [addMonthIdx, setAddMonthIdx] = useState(0);

  function addKampagne() {
    const m = KAMPAGNE_MONATE[addMonthIdx];
    const label = `${KAMPAGNE_LABELS[addMonthIdx]} ${addYear}`;
    if (kampagnen.some(k => k.t0Year === addYear && k.t0Month === m)) return;
    setKampagnen(prev => [...prev, { id: `k-${Date.now()}`, label, t0Year: addYear, t0Month: m }]);
  }

  function removeKampagne(id: string) {
    setKampagnen(prev => prev.filter(k => k.id !== id));
  }

  // Berechne den globalen Zeitraum (frühester Start bis spätestes Ende)
  const { globalStartHalf, totalHalves, months } = useMemo(() => {
    if (kampagnen.length === 0) return { globalStartHalf: 0, totalHalves: 0, months: [] };

    let minHalf = Infinity;
    let maxHalf = -Infinity;
    for (const k of kampagnen) {
      const kStart = toAbsHalf(k.t0Year, k.t0Month);
      minHalf = Math.min(minHalf, kStart);
      maxHalf = Math.max(maxHalf, kStart + TOTAL_HALF_MONTHS);
    }

    const total = maxHalf - minHalf;
    const totalMonths = Math.ceil(total / 4);

    const monthLabels: { label: string; absMonth: number }[] = [];
    const startAbsMonth = Math.floor(minHalf / 4);
    for (let i = 0; i < totalMonths; i++) {
      const absMonth = startAbsMonth + i;
      const year = Math.floor(absMonth / 12);
      const month = absMonth % 12;
      monthLabels.push({
        label: `${MONTH_NAMES[month]} ${year}`,
        absMonth,
      });
    }

    return { globalStartHalf: minHalf, totalHalves: total, months: monthLabels };
  }, [kampagnen]);

  const totalWidth = totalHalves * HALF_COL_WIDTH;
  const layerCount = getMaxLayers(AUSBILDUNGS_BLOECKE);
  const currentAbsHalf = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const quarterInMonth = day <= 7 ? 0 : day <= 15 ? 1 : day <= 23 ? 2 : 3;
    return (now.getFullYear() * 12 + now.getMonth()) * 4 + quarterInMonth;
  }, []);
  const currentHalfOffset = currentAbsHalf - globalStartHalf;
  const showCurrentMarker = currentHalfOffset >= 0 && currentHalfOffset <= totalHalves;

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
      <div className="flex flex-wrap gap-3 mb-4">
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

      {/* Timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white"
      >
        {kampagnen.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Füge eine Kampagne hinzu, um den Ausbildungsverlauf zu sehen.
          </div>
        ) : (
          <div className="relative" style={{ minWidth: totalWidth + LABEL_WIDTH }}>
            {showCurrentMarker ? (
              <div
                aria-label="Aktuelles Datum"
                className="absolute top-0 bottom-0 pointer-events-none z-30"
                style={{ left: LABEL_WIDTH + currentHalfOffset * HALF_COL_WIDTH }}
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
                    style={{ width: HALF_COL_WIDTH * 4 }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Halbmonats-Unterteilung */}
              <div className="flex" style={{ paddingLeft: LABEL_WIDTH }}>
                {Array.from({ length: Math.ceil(totalHalves / 2) }, (_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'text-[10px] text-gray-400 text-center border-r flex-shrink-0 py-0.5',
                      i % 2 === 0 ? 'border-gray-200' : 'border-gray-100'
                    )}
                    style={{ width: HALF_COL_WIDTH * 2 }}
                  >
                    {i % 2 === 0 ? '1.–15.' : '16.–31.'}
                  </div>
                ))}
              </div>
            </div>

            {/* Kampagnen-Zeilen */}
            {kampagnen.map((kampagne) => (
              <KampagneRow
                key={kampagne.id}
                kampagne={kampagne}
                globalStartHalf={globalStartHalf}
                totalHalves={totalHalves}
                layerCount={layerCount}
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
  globalStartHalf,
  totalHalves,
  layerCount,
  onRemove,
}: {
  kampagne: Kampagne;
  globalStartHalf: number;
  totalHalves: number;
  layerCount: number;
  onRemove: () => void;
}) {
  const [hoveredBlock, setHoveredBlock] = useState<StationBlock | null>(null);
  const kampagneStartHalf = toAbsHalf(kampagne.t0Year, kampagne.t0Month);
  const offsetHalves = kampagneStartHalf - globalStartHalf;

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
              <div className="text-[10px] text-gray-400">25 Monate</div>
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
          {/* Halbmonats-Gitter */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalHalves }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  'border-r flex-shrink-0 h-full',
                  i % 2 === 0 ? 'border-gray-200 bg-gray-50/30' : 'border-gray-100'
                )}
                style={{ width: HALF_COL_WIDTH }}
              />
            ))}
          </div>

          {/* Station-Blöcke (verschoben um Kampagne-Offset) */}
          {AUSBILDUNGS_BLOECKE.map((block, idx) => {
            const colors = PHASE_COLORS[block.phase];
            const left = (offsetHalves + block.startHalf) * HALF_COL_WIDTH;
            const width = (block.endHalf - block.startHalf) * HALF_COL_WIDTH;
            const top = block.layer * 32 + 4;
            const isHovered = hoveredBlock === block;

            // Absolutes Datum für Tooltip berechnen
            const startMonth = kampagne.t0Month + Math.floor(block.startHalf / 4);
            const startYear = kampagne.t0Year + Math.floor(startMonth / 12);
            const startM = startMonth % 12;
            const endMonth = kampagne.t0Month + Math.floor((block.endHalf - 1) / 4);
            const endYear = kampagne.t0Year + Math.floor(endMonth / 12);
            const endM = endMonth % 12;

            const tooltip = `${block.label}\n${MONTH_NAMES[startM]} ${startYear} – ${MONTH_NAMES[endM]} ${endYear}`;

            return (
              <div
                key={idx}
                className="absolute rounded-md border text-xs font-medium px-1.5 flex items-center cursor-default transition-shadow overflow-hidden whitespace-nowrap"
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
                <span className="truncate">{block.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
