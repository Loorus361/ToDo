import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettings } from '../../settings/hooks/useSettings';
import { getHonorarConfig, calculateFee } from '../lib/honorarDefaults';
import type { BillingTypePreset, HonorarRates } from '../../../shared/db/db';

interface SelectedItem {
  dsCount: number;
  klausurCount: number;
}

function formatEuro(value: number) {
  return `${value.toLocaleString('de-DE')} €`;
}

function parseNonNegativeInteger(rawValue: string) {
  if (rawValue.trim() === '') return 0;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getKlausurRate(preset: Extract<BillingTypePreset, { kind: 'ds' }>, rates: HonorarRates) {
  return rates[preset.klausurRateKey];
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
                const klausurRate = preset.kind === 'ds' ? getKlausurRate(preset, rates) : 0;
                const dsFee = item.dsCount * rates.doppelstunde;
                const klausurFee = item.klausurCount * klausurRate;

                return (
                  <div
                    key={preset.id}
                    className="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <span className="text-sm font-medium text-gray-900 min-w-[120px]">
                      {preset.label}
                    </span>

                    {preset.kind === 'ds' && (
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-4 md:justify-end">
                          <label className="flex flex-col gap-1 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <span>DS</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={item.dsCount}
                                onChange={(e) => updateItem(preset.id, 'dsCount', parseNonNegativeInteger(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                              />
                            </span>
                            <span className="text-xs text-gray-400">
                              x {formatEuro(rates.doppelstunde)} = {formatEuro(dsFee)}
                            </span>
                          </label>
                          <label className="flex flex-col gap-1 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <span>Klausuren</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={item.klausurCount}
                                onChange={(e) => updateItem(preset.id, 'klausurCount', parseNonNegativeInteger(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                              />
                            </span>
                            <span className="text-xs text-gray-400">
                              x {formatEuro(klausurRate)} = {formatEuro(klausurFee)}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900 md:w-24 md:text-right">
                      {formatEuro(fee)}
                    </span>
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
          {formatEuro(total)}
        </span>
      </div>
    </div>
  );
}
