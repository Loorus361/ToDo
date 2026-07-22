# Ausbildungsverlauf

Schlanke React-/Vite-PWA für den Ausbildungsverlauf laufender Referendariatskampagnen.

## Entwicklung

```bash
npm install
npm run dev
```

Build pruefen:

```bash
npm run build
```

Die App läuft standardmäßig am Basispfad `/` und ist für die Veröffentlichung über OpenAI Sites vorbereitet.

## Contributing

Dieses Projekt nutzt eine strukturierte Branch- und PR-Strategie.

Wichtige Punkte:
- Änderungen erfolgen über `feature/*` oder `fix/*` Branches
- Pull Requests gehen in der Regel nach `beta`
- `main` enthält nur stabile Versionen

Details:
Siehe [CONTRIBUTING.md](./CONTRIBUTING.md)

## Architektur

- `src/app`: schlanke App-Shell und Routing
- `src/features/ausbildung`: aktive Oberfläche und Kampagnenlogik
- weitere Feature-Verzeichnisse: vorerst deaktivierter Altbestand
- `src/shared`: gemeinsame DB- und Utility-Bausteine

## Wichtige Prinzipien

- UI-Komponenten sollen moeglichst nicht direkt auf die zentrale Dexie-DB zugreifen.
- Datenzugriffe laufen nach Moeglichkeit ueber `data`-Module innerhalb des jeweiligen Features.
- Routing bildet die App-Struktur ab; keine neue globale View-Umschaltung einfuehren.
- Neue gemeinsame Helfer gehoeren nach `src/shared`, nicht quer in einzelne Features.

Projektmanagement, To-dos, Kontakte und Honorar sind nicht mehr in Navigation oder Routing eingebunden. Ihr Code bleibt vorerst erhalten, damit über eine spätere Wiederverwendung getrennt entschieden werden kann.
