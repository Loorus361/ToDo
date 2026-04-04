# WorkVibe

Lokale React-/Vite-PWA fuer Projektorganisation, Kontakte, Kommunikation und Ausbildungsverlauf.

## Entwicklung

```bash
npm install
npm run dev
```

Build pruefen:

```bash
npm run build
```

Die App laeuft mit dem Vite-Basispfad `/ToDo/`.

## Architektur

- `src/app`: App-Shell, Routing, Sidebar, Persistenz, Backup
- `src/features`: fachliche Features wie `kanban`, `projects`, `contacts`, `settings`
- `src/shared`: gemeinsame DB- und Utility-Bausteine

## Wichtige Prinzipien

- UI-Komponenten sollen moeglichst nicht direkt auf die zentrale Dexie-DB zugreifen.
- Datenzugriffe laufen nach Moeglichkeit ueber `data`-Module innerhalb des jeweiligen Features.
- Routing bildet die App-Struktur ab; keine neue globale View-Umschaltung einfuehren.
- Neue gemeinsame Helfer gehoeren nach `src/shared`, nicht quer in einzelne Features.

## Naechste sinnvolle Schritte

- getrackte Build-Artefakte und `node_modules` aus Git entfernen
- optionale Route-Wrapper und Error-Boundaries ergaenzen
- Team-/AI-Konventionen weiter dokumentieren
