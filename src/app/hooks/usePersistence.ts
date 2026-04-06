import { useEffect, useRef } from 'react';
import { registerDirtyCallback } from '../../shared/db/db';

const BACKUP_INTERVAL_MS = 120 * 60 * 1000; // 120 Minuten

interface UsePersistenceOptions {
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  setShowBackupModal: (value: boolean) => void;
}

/**
 * Zentraler Persistenz-Hook — einmalig in App.tsx einbinden.
 *
 * Aufgaben:
 * 1. Registriert den Dirty-Callback am Dexie-Layer.
 * 2. Blockiert das Schließen des Tabs via beforeunload, wenn isDirty === true.
 * 3. Öffnet alle 120 Min. das Backup-Modal, wenn ungespeicherte Änderungen vorliegen.
 */
export function usePersistence({ isDirty, setIsDirty, setShowBackupModal }: UsePersistenceOptions): void {
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

  // Sync isDirtyRef mit aktuellem App-Wert (für beforeunload-Handler und Timer)
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // 120-Minuten-Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirtyRef.current) {
        setShowBackupModal(true);
      }
    }, BACKUP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [setShowBackupModal]);
}
