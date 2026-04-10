import { useState, useEffect } from 'react';
import { Settings, Bell, Info, Star, GraduationCap } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettings } from '../hooks/useSettings';
import { updateSettings } from '../data/settings';

function NumberInput({
  label, description, value, min, max, onChange,
}: {
  label: string; description: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm">−</button>
        <span className="w-8 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm">+</button>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const settings = useSettings();
  const [redDays,    setRedDays]    = useState(settings.deadlineRedDays);
  const [yellowDays, setYellowDays] = useState(settings.deadlineYellowDays);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRedDays(settings.deadlineRedDays);
    setYellowDays(settings.deadlineYellowDays);
  }, [settings.deadlineRedDays, settings.deadlineYellowDays]);

  async function handleSave() {
    await updateSettings({ deadlineRedDays: redDays, deadlineYellowDays: yellowDays });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={20} className="text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">Einstellungen</h2>
      </div>

      {/* ── Ausbildungsverlauf ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={14} className="text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ausbildungsverlauf</h3>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">Standard-Kampagnenanzeige</p>
          <p className="text-xs text-gray-400 mb-3">
            Welche Kampagnen beim ersten Öffnen des Ausbildungsverlaufs angezeigt werden.
          </p>
          <div className="flex gap-2">
            {(['aktuelle', 'alle_laufenden'] as const).map((modus) => (
              <button
                key={modus}
                onClick={() => updateSettings({ defaultKampagnenModus: modus })}
                className={clsx('px-4 py-2 text-sm rounded-lg border font-medium transition-colors',
                  (settings.defaultKampagnenModus ?? 'aktuelle') === modus
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {modus === 'aktuelle' ? 'Aktuelle Kampagne' : 'Alle laufenden'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Standard-Status ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star size={14} className="text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Neues To-Do</h3>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-1">Standard-Status</p>
          <p className="text-xs text-gray-400 mb-3">In welche Spalte neue To-Dos standardmäßig landen.</p>
          <div className="flex gap-2">
            {(['backlog', 'doing'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateSettings({ defaultTodoStatus: s })}
                className={clsx('px-4 py-2 text-sm rounded-lg border font-medium transition-colors',
                  settings.defaultTodoStatus === s
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {s === 'backlog' ? 'Backlog' : 'In Arbeit'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fristen-Farben ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={14} className="text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fristenfarben</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Steuert, ab wie vielen verbleibenden Tagen eine Deadline farbig markiert wird.
        </p>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-1">
          <NumberInput
            label="Rot ab … Tagen"
            description="Deadlines die in ≤ N Tagen fällig sind (inkl. heute/überfällig = 0)"
            value={redDays} min={0} max={yellowDays - 1} onChange={setRedDays}
          />
          <NumberInput
            label="Gelb ab … Tagen"
            description="Deadlines die in ≤ N Tagen fällig sind (muss größer als der Rot-Wert sein)"
            value={yellowDays} min={redDays + 1} max={90} onChange={setYellowDays}
          />
        </div>
        <div className="mt-3 flex gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-gray-500">≤ {redDays} Tage → <span className="text-red-500 font-semibold">Rot</span></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-gray-500">{redDays + 1}–{yellowDays} Tage → <span className="text-yellow-600 font-medium">Gelb</span></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-gray-500">&gt; {yellowDays} Tage → Normal</span>
          </span>
        </div>
      </section>

      {/* ── Datensicherung ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-gray-400" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datensicherung</h3>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Alle Daten (Projekte, To-Dos, Kommunikation, Kontakte, <strong>Einstellungen</strong>) werden
            als JSON exportiert. Der <em>Speichern</em>-Button in der Sidebar löst den Download aus.
            Ein Backup alle 30 Minuten wird automatisch empfohlen, wenn ungespeicherte Änderungen vorliegen.
          </p>
        </div>
      </section>

      {/* Speichern (nur für Fristenfarben nötig, Rest speichert sofort) */}
      <button
        onClick={handleSave}
        className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        {saved ? '✓ Gespeichert' : 'Fristenfarben speichern'}
      </button>
    </div>
  );
}
