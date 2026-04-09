# Contributing Guidelines

## Geltungsbereich

Diese Regeln gelten für alle Beiträge – inklusive KI-generierter Änderungen (z. B. Codex, Claude).

## Ziel
Dieses Repository folgt einfachen, klaren Regeln, um Änderungen nachvollziehbar, reviewbar und stabil zu halten.

---

## Grundprinzipien

- Ein PR = eine fachliche Änderung oder ein zusammenhängendes Themenpaket
- Kleine bis mittlere PRs bevorzugen
- Verständliche Commit-Historie
- Keine unnötige Komplexität

---

## Branching

- `main` = stabile Version (Production)
- `beta` = Test / Vorabversion
- Feature-Branches:
  - `feature/<name>`
  - `fix/<name>`

Beispiele:
- `feature/reminder-time`
- `fix/todo-validation`

---

## Workflow (verbindlich)

- Neue Arbeit erfolgt immer in einem `feature/*` oder `fix/*` Branch
- Branch wird von `beta` erstellt
- PR geht immer von `feature/*` → `beta`
- `main` wird ausschließlich über `beta` aktualisiert
- Direktes Arbeiten auf `main` oder `beta` ist nicht erlaubt

---

## Commits

Wir nutzen folgende Prefixe:

- `feat:` neue Funktion
- `fix:` Bugfix
- `refactor:` Code-Verbesserung ohne neue Funktion
- `test:` Tests
- `docs:` Dokumentation
- `chore:` Sonstiges

Beispiele:
- `feat: add reminder time to todos`
- `fix: correct reminder validation`
- `refactor: simplify todo form logic`

### Regeln
- Jeder Commit sollte eine klare, verständliche Änderung enthalten
- Keine unklaren Messages wie:
  - `fix stuff`
  - `update`
- WIP-Commits sind erlaubt, werden aber vor Merge aufgeräumt

---

## Pull Requests (PR)

Ein PR sollte:

- Ziel-Branch ist in der Regel `beta` (nicht `main`)
- möglichst **ein klares Thema** behandeln
- mehrere Änderungen sind erlaubt, wenn sie **fachlich zusammengehören**
- verständlich beschreiben:
  - was geändert wurde
  - warum es geändert wurde

### Mehrere Änderungen in einem PR

Ein PR darf enthalten:
- mehrere Features
- mehrere Fixes
- Kombination aus Feature + Fix

Voraussetzung:
- Änderungen gehören logisch zusammen
- PR bleibt gut reviewbar

Nicht empfohlen:
- komplett unabhängige Themen in einem PR bündeln

### PR-Template

Für jeden PR wird das bereitgestellte Template genutzt.
Dieses strukturiert:
- Features
- Fixes
- Kontext
- Tests

---

## Merge-Strategie

Standard: **Squash and Merge**

- PRs werden in der Regel gesquasht
- Commit-Message beschreibt die finale Änderung

Beispiel:
- `feat: add todo reminder feature`

### Ausnahme
Kein Squash, wenn die Commit-Historie sinnvoll strukturiert ist und mehrere Aspekte getrennt nachvollziehbar bleiben sollen (z. B. Feature + Fix + Refactor).

---

## Umgang mit KI (Codex, Claude, etc.)

- KI-generierter Code muss verstanden werden
- PRs von KI sollten wie normale PRs behandelt werden
- Keine ungeprüften Merges

---

## Qualität

Vor Merge sollte sichergestellt sein:

- App funktioniert lokal
- Keine offensichtlichen Fehler
- Keine Console-Errors im Browser
- Relevante Tests laufen (falls vorhanden)

---

## Branch Protection

- `main` ist geschützt (PR + Review erforderlich)
- `beta` ist geschützt (kein Force Push / kein Löschen)

---
