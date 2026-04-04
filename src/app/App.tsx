import { useEffect, useState } from 'react';
import { usePersistence } from './hooks/usePersistence';
import { exportDatabase } from './lib/dbBackup';
import { useSettings } from '../features/settings/hooks/useSettings';
import { BackupModal } from './components/BackupModal';
import { AppSidebar } from './components/AppSidebar';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const [isDirty, setIsDirty] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  usePersistence({ isDirty, setIsDirty, setShowBackupModal });
  const settings = useSettings();

  // Theme via CSS-Variablen auf <html> anwenden
  useEffect(() => {
    document.documentElement.dataset.accent = settings.accentColor ?? 'blue';
    document.documentElement.dataset.bg = settings.bgStyle ?? 'light';
  }, [settings.accentColor, settings.bgStyle]);

  async function handleManualExport() {
    const ok = await exportDatabase();
    if (ok) setIsDirty(false);
  }

  return (
    <div className="flex h-screen bg-white">
      <AppSidebar
        isDirty={isDirty}
        onExport={handleManualExport}
        onImport={() => setShowBackupModal(true)}
      />

      <main className="flex-1 overflow-auto p-8" style={{ backgroundColor: 'rgb(var(--bg-main))' }}>
        <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 min-h-0">
          <AppRoutes />
        </div>
      </main>

      {showBackupModal && (
        <BackupModal
          isReminder={isDirty}
          onResetDirty={() => setIsDirty(false)}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </div>
  );
}
