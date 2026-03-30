import { useEffect, useRef } from 'react';
import { registerDirtyCallback } from '../db/db';
import { useStore } from '../store/useStore';

const BACKUP_INTERVAL_MS = 30 * 60 * 1000; // 30 Minuten

/**
 * Zentraler Persistenz-Hook — einmalig in App.tsx einbinden.
 *
 * Aufgaben:
 * 1. Registriert den Dirty-Callback am Dexie-Layer.
 * 2. Blockiert das Schließen des Tabs via beforeunload, wenn isDirty === true.
 * 3. Öffnet alle 30 Min. das Backup-Modal, wenn ungespeicherte Änderungen vorliegen.
 */
export function usePersistence(): void {
  const setIsDirty = useStore((s) => s.setIsDirty);
  const setShowBackupModal = useStore((s) => s.setShowBackupModal);
  const isDirtyRef = useRef(false);

  // Dirty-Callback einmalig registrieren
  useEffect(() => {
    registerDirtyCallback(() => {
      isDirtyRef.current = true;
      setIsDirty(true);
    });
  }, [setIsDirty]);

  // beforeunload: Tab-Schließen blockieren wenn dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        // Für ältere Browser-Kompatibilität
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Sync isDirtyRef mit aktuellem Store-Wert (für beforeunload-Handler)
  useEffect(() => {
    return useStore.subscribe((state) => {
      isDirtyRef.current = state.isDirty;
    });
  }, []);

  // 30-Minuten-Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirtyRef.current) {
        setShowBackupModal(true);
      }
    }, BACKUP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [setShowBackupModal]);
}
