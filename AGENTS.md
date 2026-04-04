# AGENTS

## Ziel

Dieses Projekt soll fuer iterative Entwicklung mit AI-Coding-Tools gut lesbar und leicht veraenderbar bleiben.

## Bevorzugte Arbeitsweise

- Kleine, verifizierbare Refactor-Schritte statt Big-Bang-Umbauten
- Nach groesseren Struktur- oder Routing-Aenderungen immer `npm run build` ausfuehren
- Feature-Grenzen respektieren und keine neue globale Kopplung einfuehren

## Strukturregeln

- `src/app` enthaelt nur App-Shell-Themen: Layout, Navigation, Routing, Persistenz, Backup
- `src/features/<name>` enthaelt UI, Hooks und Datenzugriffe fuer genau ein Feature
- `src/shared` enthaelt uebergreifende Utilities und den zentralen DB-Layer

## Datenzugriffe

- Komponenten sollen bevorzugt Funktionen aus `src/features/*/data/*.ts` verwenden
- Direktzugriffe auf `src/shared/db/db.ts` nur dort, wo noch keine Feature-API existiert
- Neue Feature-Logik zuerst im eigenen `data`-Modul oder Hook kapseln, dann in der UI verwenden

## Routing

- Navigation laeuft ueber `react-router-dom`
- Projekt-Detailseiten werden per URL modelliert, nicht ueber lokalen App-Status
- Den Basispfad `/ToDo/` bei Routing- oder Deployment-Aenderungen mitdenken

## Wenn du etwas umbaust

- Verhalten moeglichst nicht gleichzeitig mit Struktur veraendern
- Keine Build-Artefakte oder lokale Cache-Dateien bewusst versionieren
- Bei groesseren Umbauten erst Architektur, dann Feinschliff
