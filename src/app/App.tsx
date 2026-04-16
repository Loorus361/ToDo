// Root-Komponente: verbindet Persistenz, Backup-Modal, Sidebar und Routing
import { lazy, Suspense, useState } from 'react';
import { usePersistence } from './hooks/usePersistence';
import { AppSidebar } from './components/AppSidebar';
import { AppRoutes } from './routes/AppRoutes';

const BackupModal = lazy(() =>
  import('./components/BackupModal').then((module) => ({ default: module.BackupModal }))
);

export default function App() {
  const [isDirty, setIsDirty] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  usePersistence({ isDirty, setIsDirty, setShowBackupModal });

  async function handleManualExport() {
    const { exportDatabase } = await import('./lib/dbBackup');
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
        <Suspense fallback={<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />}>
          <BackupModal
            isReminder={isDirty}
            onResetDirty={() => setIsDirty(false)}
            onClose={() => setShowBackupModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
