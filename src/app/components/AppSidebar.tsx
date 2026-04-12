// Seitennavigation mit Links zu allen Features sowie Backup- und Import-Aktionen
import { Calculator, Circle, FolderOpen, GraduationCap, LayoutDashboard, Save, Settings, Upload, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS: { to: string; label: string; icon: React.ReactNode }[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/projects', label: 'Projekte', icon: <FolderOpen size={18} /> },
  { to: '/contacts', label: 'Kontakte', icon: <Users size={18} /> },
  { to: '/ausbildung', label: 'Ausbildung', icon: <GraduationCap size={18} /> },
  { to: '/honorar', label: 'Honorar', icon: <Calculator size={18} /> },
];

interface AppSidebarProps {
  isDirty: boolean;
  onExport: () => void;
  onImport: () => void;
}

export function AppSidebar({ isDirty, onExport, onImport }: AppSidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-100 flex flex-col py-6 px-4">
      <div className="mb-6 px-2 flex items-center gap-2">
        <h1 className="text-base font-semibold text-gray-900 tracking-tight">WorkVibe</h1>
        {isDirty && (
          <span title="Ungespeicherte Änderungen" className="flex-shrink-0">
            <Circle size={7} className="fill-primary-500 text-primary-500" />
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 border-t border-gray-100 mt-4 flex flex-col gap-1">
        <button
          onClick={onExport}
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
            isDirty ? 'text-primary-600 hover:bg-primary-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Save size={18} />
          Speichern
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left"
        >
          <Upload size={18} />
          Importieren
        </button>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
              isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )
          }
        >
          <Settings size={18} />
          Einstellungen
        </NavLink>
      </div>
    </aside>
  );
}
