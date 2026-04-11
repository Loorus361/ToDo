# Test-Backups

Diese Dateien sind **synthetische Test-Fixtures** für Import-, Migrations- und Release-Tests.

Sie sind absichtlich:
- anonym
- reproduzierbar
- versionierbar
- frei von echten Nutzerdaten

Deshalb sollen sie **im Repository bleiben** und nicht in `.gitignore`.

## Dateien

### `legacy-main-upgrade-edge-cases.json`

Simuliert einen realistischen Altbestand aus dem älteren `main`-Stand kurz vor dem Merge von `beta` nach `main`.

Enthält unter anderem:
- vollständige Tabellenstruktur eines echten Alt-Exports
- viele normale Datensätze für Projekte, Kontakte, Kommunikation, Todos und Milestones
- absichtlich fehlende neue `settings`-Felder aus `beta`
- insbesondere fehlend:
  - `defaultKampagnenModus`
  - `honorarConfig`

Geeignet für:
- manuellen Smoke-Test vor Release
- Prüfung, ob neue UI-Bereiche mit alten Backups stabil umgehen
- Regressionstests für Import und Upgrade-Verhalten

### `legacy-v1-migration-stress-test.json`

Simuliert einen deutlich älteren und kaputteren Altbestand.

Enthält unter anderem:
- keine `_appSchemaVersion`
- nur v1-Tabellen
- fehlende `settings`-, `milestones`- und `projectTemplates`-Tabellen
- alte Todo-Felder wie `startDate` und `startAfterId`
- `backlog-low`-Einträge, die migriert werden müssen
- verwaiste Referenzen auf nicht vorhandene Projekte, Personen oder Kommunikation

Geeignet für:
- Migrations-Stresstest
- Validierung robuster Importlogik
- Prüfung, wie tolerant die App auf alte oder inkonsistente Daten reagiert

## Verwendung

Manuell:
- Datei über die Import-Funktion der App laden
- anschließend die Schritte aus [release-smoke-test-beta-to-main.md](../testing/release-smoke-test-beta-to-main.md) durchgehen

Automatisiert:
- Fixtures in Unit-/Integrationstests einlesen
- Import- und Migrationslogik gegen reale Beispiel-Backups prüfen

## Regeln

- Keine echten Nutzerdaten einchecken
- Neue Testdateien nur dann hinzufügen, wenn sie einen klaren neuen Fall abdecken
- Dateinamen so wählen, dass Altstand und Testzweck direkt erkennbar sind
