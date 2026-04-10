import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettings } from '../../settings/hooks/useSettings';
import { getHonorarConfig, calculateFee } from '../lib/honorarDefaults';
import type { BillingTypePreset } from '../../../shared/db/db';

interface SelectedItem {
  dsCount: number;
  klausurCount: number;
}

export default function HonorarView() {
  const settings = useSettings();
  const config = getHonorarConfig(settings);
  const { rates, presets } = config;

  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());

  function toggle(preset: BillingTypePreset) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(preset.id)) {
        next.delete(preset.id);
      } else {
        next.set(preset.id, {
          dsCount: preset.kind === 'ds' ? preset.dsCount : 0,
          klausurCount: preset.kind === 'ds' ? preset.klausurCount : 0,
        });
      }
      return next;
    });
  }

  function updateItem(id: string, field: 'dsCount' | 'klausurCount', value: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) next.set(id, { ...item, [field]: Math.max(0, value) });
      return next;
    });
  }

  const total = useMemo(() => {
    let sum = 0;
    for (const preset of presets) {
      const item = selected.get(preset.id);
      if (!item) continue;
      sum += calculateFee(preset, rates, item);
    }
    return sum;
  }, [selected, presets, rates]);

  const dsPresets = presets.filter((p) => p.kind === 'ds');
  const flatPresets = presets.filter((p) => p.kind === 'flat');

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Calculator size={20} className="text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">Honorarrechner</h2>
      </div>

      {/* ── Abrechnungsart-Auswahl ── */}
      <section className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          DS-basierte Abrechnungsarten
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {dsPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => toggle(preset)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors',
                selected.has(preset.id)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Pauschale Positionen
        </h3>
        <div className="flex flex-wrap gap-2">
          {flatPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => toggle(preset)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors',
                selected.has(preset.id)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Detail-Bereich ── */}
      {selected.size > 0 && (
        <section className="mb-6">
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {presets
              .filter((p) => selected.has(p.id))
              .map((preset) => {
                const item = selected.get(preset.id)!;
                const fee = calculateFee(preset, rates, item);

                return (
                  <div key={preset.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-gray-900 min-w-[120px]">
                      {preset.label}
                    </span>

                    {preset.kind === 'ds' ? (
                      <div className="flex items-center gap-4 flex-1 justify-end">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          DS
                          <input
                            type="number"
                            min={0}
                            value={item.dsCount}
                            onChange={(e) => updateItem(preset.id, 'dsCount', Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          Klausuren
                          <input
                            type="number"
                            min={0}
                            value={item.klausurCount}
                            onChange={(e) => updateItem(preset.id, 'klausurCount', Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                          />
                        </label>
                        <span className="text-sm font-semibold text-gray-900 w-24 text-right">
                          {fee.toLocaleString('de-DE')} €
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {fee.toLocaleString('de-DE')} €
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ── Gesamtsumme ── */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Gesamt</span>
        <span className="text-lg font-bold text-primary-600">
          {total.toLocaleString('de-DE')} €
        </span>
      </div>
    </div>
  );
}
