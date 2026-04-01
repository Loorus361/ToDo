import { useRef, useState, useEffect, useCallback } from 'react';
import { Download, Upload, X, ShieldCheck } from 'lucide-react';
import { exportDatabase, importDatabase } from '../utils/dbBackup';
import { useStore } from '../store/useStore';

interface Props {
  /** true = 30-Min-Erinnerung, false = manuell geöffnet */
  isReminder?: boolean;
  onClose: () => void;
}

export function BackupModal({ isReminder = false, onClose }: Props) {
  const setIsDirty = useStore((s) => s.setIsDirty);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  // ESC schließt das Modal
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);

  async function handleExport() {
    const ok = await exportDatabase();
    if (ok) {
      setIsDirty(false);
      setStatus('success');
      setTimeout(onClose, 1200);
    } else {
      setStatus('error');
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Achtung: Die lokale Datenbank wird vollständig überschrieben. Fortfahren?')) {
      e.target.value = '';
      return;
    }
    setImporting(true);
    const ok = await importDatabase(file);
    setImporting(false);
    e.target.value = '';
    if (ok) {
      setIsDirty(false);
      setStatus('success');
      setTimeout(onClose, 1200);
    } else {
      setStatus('error');
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-sm mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary-500 flex-shrink-0 mt-px" />
            <h2 className="text-sm font-semibold text-gray-900">
              {isReminder ? 'Backup empfohlen' : 'Datensicherung'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {status === 'idle' && (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {isReminder
                ? 'Es liegen ungespeicherte Änderungen vor. Jetzt ein Backup als JSON-Datei erstellen?'
                : 'Datenbank exportieren oder aus einem bestehenden Backup wiederherstellen.'}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Download size={15} />
                Backup erstellen (JSON)
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Upload size={15} />
                {importing ? 'Importiere…' : 'Aus Backup wiederherstellen'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>

            {isReminder && (
              <button
                onClick={onClose}
                className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                Später erinnern
              </button>
            )}
          </>
        )}

        {status === 'success' && (
          <p className="text-sm text-green-600 text-center py-2">✓ Erfolgreich abgeschlossen.</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500 text-center py-2">
            Fehler aufgetreten. Bitte in der Konsole prüfen.
          </p>
        )}
      </div>
    </div>
  );
}
