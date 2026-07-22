// Entfernt ausschließlich das generierte Deployment-Verzeichnis vor einem neuen Build
import { rm } from 'node:fs/promises';

await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
