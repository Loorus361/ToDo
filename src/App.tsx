import { LayoutDashboard, FolderOpen, Users, Download, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore, type View } from './store/useStore';
import { usePersistence } from './hooks/usePersistence';
import { exportDatabase } from './utils/dbBackup';
import KanbanBoard from './components/KanbanBoard';
import ProjectsView from './components/ProjectsView';
import ProjectDetail from './components/ProjectDetail';
import ContactsView from './components/ContactsView';
import { BackupModal } from './components/BackupModal';

const NAV_ITEMS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { view: 'projects', label: 'Projekte', icon: <FolderOpen size={18} /> },
  { view: 'contacts', label: 'Kontakte', icon: <Users size={18} /> },
];

export default function App() {
  // Persistenz-Hook einmalig auf oberster Ebene einbinden
  usePersistence();

  const {
    activeView,
    setActiveView,
    selectedProjectId,
    isDirty,
    setIsDirty,
    showBackupModal,
    setShowBackupModal,
  } = useStore();

  async function handleManualExport() {
    const ok = await exportDatabase();
    if (ok) setIsDirty(false);
  }

  return (
    <div className="flex h-screen bg-white">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-100 flex flex-col py-6 px-4">
        {/* Logo */}
        <div className="mb-6 px-2 flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900 tracking-tight">WorkVibe</h1>
          {isDirty && (
            <span title="Ungespeicherte Änderungen" className="flex-shrink-0">
              <Circle size={7} className="fill-primary-500 text-primary-500" />
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ view, label, icon }) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                activeView === view
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* Backup-Button (Sidebar Footer) */}
        <div className="pt-4 border-t border-gray-100 mt-4 flex flex-col gap-1">
          <button
            onClick={handleManualExport}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left"
          >
            <Download size={18} />
            Backup (JSON)
          </button>
          <button
            onClick={() => setShowBackupModal(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left"
          >
            <FolderOpen size={18} />
            Importieren
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl w-full mx-auto flex flex-col flex-1 min-h-0">
          {activeView === 'dashboard' && (
            <div className="flex flex-col h-[calc(100vh-4rem)]">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>
              <div className="flex-1 min-h-0">
                <KanbanBoard />
              </div>
            </div>
          )}
          {activeView === 'projects' && (
            selectedProjectId != null ? <ProjectDetail /> : <ProjectsView />
          )}
          {activeView === 'contacts' && <ContactsView />}
        </div>
      </main>

      {/* ── Backup Modal ── */}
      {showBackupModal && (
        <BackupModal
          isReminder={isDirty}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </div>
  );
}
