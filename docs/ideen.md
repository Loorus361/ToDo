ideen.md in Issues oder Discussions übernehmen

------

- Ausbildungsverlauf soll auf die gesamte seitenbreite sich verbreitern
- Skalierung muss gespeichert bleiben 
- alle Skalierungen verkleinern (selber machen)

------

Ausbildungsverlauf:
⁃ Anzahl Monate unter Kampagnen Name kann weg (erledigt, bereits live). Dafür Hinweis ob Vollzeit 24(25) / Voll- und Teilzeit 27(28) / Teilzeit 30 (31)
⁃ EZSV per Knopf hinzuschaltbar (oder immer?)
⁃ Das alles auch für Voll-Teilzeit und Teilzeit
- Den Verlauf (Sprung zwischen den Kampagnen) für Durchfallen darstellen / Angabe: Start Kampagne + einmal oder zweimal durchgefallen
- Den Verlauf einer Person genau nachzeichnen inkl. 1. schriftlich durchgefallen -> AVL -> EZSV -> 2. schriftliche -> AVL zuhörer -> mündliche

------

- If database empty open import dialog

------

- Ideen Sammler / Brainstorming / Notizen—> in Aufgaben/Projekt übertragbar

------

- Notizen Feld für Projekte

------

Projekt-Templates:
Todos sollten ein relatives Datum bekommen?!
a) T0 = Frist des Projekts 
Todos von T0 zurück gerechnet 
b) T0 = Datum der Anlage des Projekts aus dem Template
Todos von T0 weiter gerechnet. 
Logik könnte gegebenenfalls von Ausbildungsverlauf übernommen werden 

------

Claude soll Nachricht an Dezernentin machen.
Projekt vorstellen, und überzeugen, das ich
- Geld brauche für Claude und Github Abo
- ggf. Server vom KG
- Möglichkeit PWAs zu installieren (besteht) die nicht täglich gelöscht werden (besteht nicht)
- mehr Zeit = weniger Planung
- Ideen für weitere Automatisierungen im RefRef

------

fertiger Prompt:
Wir wollen Unit-Tests für die puren Utility-Funktionen im Projekt nachrüsten.
Fang mit den drei einfachsten Dateien an — keine DB-Abhängigkeit, nur Logik:

1. src/shared/lib/deadlineColors.ts — getDeadlineStatus()
2. src/shared/lib/projectColors.ts — getProjectColor() und Hilfsfunktionen
3. src/features/honorar/lib/honorarDefaults.ts — calculateFee() und getHonorarConfig()

Vorhandene Testinfrastruktur: Vitest, fake-indexeddb, Setup in src/test/setup.ts.
Referenz für Stil und Struktur: src/app/lib/__tests__/dbBackup.test.ts

Für jede Datei:
- Eigene __tests__/-Datei direkt neben der Quelldatei anlegen
- Edge Cases abdecken (null, undefined, Grenzwerte)
- Keine Mocks für pure Funktionen
- Danach: npm run test

------