// Einstellungsabschnitt für Honorarsätze und Abrechnungsvorlagen (eingebettet in SettingsView)
import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSettings } from '../../settings/hooks/useSettings';
import { updateSettings } from '../../settings/data/settings';
import { getHonorarConfig, DEFAULT_HONORAR_CONFIG } from '../lib/honorarDefaults';
import type { HonorarRates, BillingTypePreset } from '../../../shared/db/db';

const RATE_LABELS: { key: keyof HonorarRates; label: string; description: string }[] = [
  { key: 'doppelstunde', label: 'Doppelstunde (DS)', description: 'Vergütung pro Doppelstunde' },
  { key: 'klausur', label: 'Klausur', description: 'Vergütung pro Klausur (Standard)' },
  { key: 'klkuKlausur', label: 'KlKU-Klausur', description: 'Vergütung pro Klausur (KlKU)' },
  { key: 'ueberarbeitungInternet', label: 'Überarbeitung Internet-Klausur', description: 'Pauschale' },
  { key: 'besprechungInternet', label: 'Besprechung Internet-Klausur', description: 'Pauschale' },
  { key: 'ueberarbeitungAVL', label: 'Überarbeitung Internet-AVL', description: 'Pauschale' },
  { key: 'besichtigung', label: 'Besichtigung', description: 'Pauschale' },
];

export default function HonorarSettingsSection() {
  const settings = useSettings();
  const config = getHonorarConfig(settings);

  const [rates, setRates] = useState<HonorarRates>(config.rates);
  const [presets, setPresets] = useState<BillingTypePreset[]>(config.presets);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = getHonorarConfig(settings);
    setRates(c.rates);
    setPresets(c.presets);
  }, [settings]);

  function parseNonNegativeNumber(rawValue: string) {
    if (rawValue.trim() === '') return 0;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function parseNonNegativeInteger(rawValue: string) {
    if (rawValue.trim() === '') return 0;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  function updateRate(key: keyof HonorarRates, value: number) {
    setRates((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  function updatePresetField(id: string, field: 'dsCount' | 'klausurCount', value: number) {
    setPresets((prev) =>
      prev.map((p) => (p.id === id && p.kind === 'ds' ? { ...p, [field]: Math.max(0, value) } : p)),
    );
  }

  async function handleSave() {
    await updateSettings({ honorarConfig: { rates, presets } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setRates(DEFAULT_HONORAR_CONFIG.rates);
    setPresets(DEFAULT_HONORAR_CONFIG.presets);
  }

  const dsPresets = presets.filter((p): p is Extract<BillingTypePreset, { kind: 'ds' }> => p.kind === 'ds');

  return (
    <div>
      {/* ── Vergütungssätze ── */}
      <section className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Vergütungssätze (EUR)
        </h3>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-1 divide-y divide-gray-50">
          {RATE_LABELS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="number"
                  min={0}
                  value={rates[key]}
                  onChange={(e) => updateRate(key, parseNonNegativeNumber(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                />
                <span className="text-xs text-gray-400">€</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DS-Vorbelegungen ── */}
      <section className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Vorbelegungen (DS & Klausuren)
        </h3>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-1 divide-y divide-gray-50">
          {dsPresets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-900 min-w-[100px]">
                {preset.label}
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  DS
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={preset.dsCount}
                    onChange={(e) => updatePresetField(preset.id, 'dsCount', parseNonNegativeInteger(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  Kl.
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={preset.klausurCount}
                    onChange={(e) => updatePresetField(preset.id, 'klausurCount', parseNonNegativeInteger(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-200 rounded-md text-center text-sm"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Aktionen ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          {saved ? '✓ Gespeichert' : 'Honorar-Einstellungen speichern'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={14} />
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}
