# Release Smoke Test: `beta` nach `main`

Ziel: In 10 bis 15 Minuten prüfen, ob der Stand aus `beta` mit einem realistischen Alt-Backup aus `main` stabil läuft und keine offensichtlichen Regressionen enthält.

Verwendete Testdatei:
- [legacy-main-upgrade-edge-cases.json](../test-data/backups/legacy-main-upgrade-edge-cases.json)

Wichtige Annahme:
- Die Backup-Datei simuliert einen Export aus dem älteren `main`-Stand.
- In `settings` fehlen absichtlich neue Felder aus `beta`, vor allem `defaultKampagnenModus` und `honorarConfig`.
- Der Test prüft damit gezielt den Upgrade-Fall: Nutzer arbeitet mit alter Version, dann wird die neue Version ausgerollt.

## Vorbereitung

1. Sicherstellen, dass du auf dem gewünschten Branch/PR-Teststand bist.
2. `npm run build` ausführen.
3. App mit leerer Datenbank starten oder vorhandene IndexedDB vor dem Test zurücksetzen.
4. Backup-Datei importieren.
5. Bestätigen, dass der Import ohne Fehlermeldung durchläuft.

## Import und Grundzustand

1. Nach dem Import prüfen, dass die App nicht abstürzt und die Sidebar vollständig sichtbar ist.
2. Prüfen, dass folgende Menüpunkte vorhanden und klickbar sind:
   - Dashboard
   - Projekte
   - Kontakte
   - Ausbildung
   - Honorar
   - Einstellungen
3. Prüfen, dass kein offensichtlicher Rendering-Fehler direkt nach dem Import sichtbar ist.

## Dashboard / Kanban

1. Dashboard öffnen.
2. Prüfen, dass To-Dos in mehreren Spalten sichtbar sind:
   - `today`
   - `backlog`
   - `doing`
   - `done`
   - `archived`
3. Prüfen, dass mindestens ein To-Do mit Projektbezug korrekt einen Projektnamen/Farbkontext zeigt.
4. Prüfen, dass mindestens ein To-Do mit Deadline farblich markiert wird.
5. Ein bestehendes To-Do öffnen und prüfen:
   - Titel sichtbar
   - Beschreibung sichtbar, falls vorhanden
   - Projektbezug korrekt
6. Ein To-Do von `backlog` nach `doing` oder `today` verschieben und prüfen, dass die Änderung erhalten bleibt.
7. Seite neu laden und prüfen, dass die Änderung weiter vorhanden ist.

## Projekte und Detailseiten per URL

1. Projekte öffnen.
2. Prüfen, dass mehrere Projekte geladen werden, darunter:
   - Projekte mit Deadline
   - Projekte ohne Deadline
   - Projekte mit Farbe
   - Projekte ohne Farbe
3. Ein Projekt normal aus der Liste öffnen.
4. Danach die URL manuell prüfen:
   - `/projects/1`
   - `/projects/2`
5. Auf der Detailseite prüfen:
   - Kommunikationshistorie sichtbar
   - Milestones sichtbar
   - Projekt-To-Dos sichtbar
6. Ein Milestone als erledigt markieren oder bearbeiten und prüfen, dass die Änderung gespeichert bleibt.
7. Eine Kommunikationsnotiz öffnen bzw. prüfen, dass verknüpfte Kommunikation nicht abstürzt.
8. Optional: ungültige URL wie `/projects/999999` oder `/projects/foo` testen und prüfen, dass die App sauber reagiert.

## Kontakte

1. Kontakte öffnen.
2. Prüfen, dass Personen mit unterschiedlichen Datenständen erscheinen:
   - nur Name
   - Name + Telefon
   - Name + E-Mail
   - Notizen
   - Gruppen
3. Eine Person mit mehreren Gruppen prüfen.
4. Eine Person ohne Kontaktfelder prüfen.
5. Einen kleinen Edit durchführen und neu laden, um Persistenz zu prüfen.

## Ausbildung

1. Ausbildung öffnen.
2. Prüfen, dass die Seite trotz fehlendem `defaultKampagnenModus` im importierten `settings`-Datensatz sauber lädt.
3. Prüfen, dass initial eine sinnvolle Default-Anzeige erscheint und kein leerer/defekter Zustand sichtbar ist.
4. Eine Kampagne hinzufügen oder entfernen.
5. Prüfen, dass der Ausbildungsverlauf horizontal korrekt rendern und scrollen kann.
6. Seite neu laden und prüfen, dass der Zustand stabil bleibt.

## Honorar

1. Honorar öffnen.
2. Prüfen, dass die Seite trotz fehlendem `honorarConfig` im importierten `settings`-Datensatz ohne Fehler lädt.
3. Prüfen, dass Standardwerte sichtbar sind.
4. Mindestens eine DS-basierte Abrechnungsart auswählen und Beträge prüfen.
5. Mindestens eine Pauschale auswählen.
6. Prüfen, dass die Gesamtsumme korrekt reagiert.
7. Ein paar Eingaben verändern und auf ganzzahlige/robuste Eingabeverarbeitung achten.

## Einstellungen

1. Einstellungen öffnen.
2. Tab `Allgemein` prüfen:
   - Fristenfarben sichtbar
   - Standard-Status sichtbar
   - Standard-Kampagnenanzeige sichtbar
3. Prüfen, dass fehlende neue Felder aus dem Alt-Backup sauber auf Defaults fallen und die Seite nicht abstürzt.
4. `defaultKampagnenModus` einmal umstellen.
5. `defaultTodoStatus` einmal umstellen.
6. Fristenfarben ändern und speichern.
7. Tab `Honorar` öffnen.
8. Prüfen, dass Default-Honorarwerte und Presets geladen werden, obwohl sie im Alt-Backup fehlen.
9. Falls möglich, eine Honorar-Einstellung ändern und speichern.
10. Seite neu laden und prüfen, dass neue Einstellungen weiter vorhanden sind.

## Backup / Restore

1. Über die Sidebar `Speichern` auslösen.
2. Prüfen, dass ein Export heruntergeladen wird.
3. Optional die exportierte Datei kurz ansehen und prüfen, dass `settings` nun die neuen Felder enthalten oder zumindest stabil exportiert werden.

## Abschlusskriterien

Der Smoke-Test ist bestanden, wenn:
- der Import des Alt-Backups ohne Fehlermeldung funktioniert
- alle Hauptseiten laden
- Honorar und Ausbildung trotz fehlender neuer Settings-Felder stabil funktionieren
- Projekt-Detailseiten per URL funktionieren
- Änderungen gespeichert bleiben
- `npm run build` erfolgreich war

Wenn einer dieser Punkte fehlschlägt, ist der `beta -> main`-Merge aus Release-Sicht noch nicht sauber genug.
