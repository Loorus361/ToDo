import { create } from 'zustand';

export type View = 'dashboard' | 'projects' | 'contacts' | 'settings';

interface AppState {
  activeView: View;
  setActiveView: (view: View) => void;
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
  // Dirty-State: true nach jedem DB-Schreibvorgang, false nach erfolgreichem Export
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  // Backup-Modal: gesteuert durch 30-Min-Timer oder manuellen Trigger
  showBackupModal: boolean;
  setShowBackupModal: (value: boolean) => void;
  // Dashboard-Filter
  filterProjectId: number | null;
  setFilterProjectId: (id: number | null) => void;
  showArchived: boolean;
  setShowArchived: (value: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view, selectedProjectId: null }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  isDirty: false,
  setIsDirty: (value) => set({ isDirty: value }),
  showBackupModal: false,
  setShowBackupModal: (value) => set({ showBackupModal: value }),
  filterProjectId: null,
  setFilterProjectId: (id) => set({ filterProjectId: id }),
  showArchived: false,
  setShowArchived: (value) => set({ showArchived: value }),
}));
