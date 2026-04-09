# Contributing Guidelines

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

Das bedeutet:
- Alle Commits eines PR werden zu einem Commit zusammengefasst
- Commit-Message beschreibt die finale Änderung

Beispiel:
- `feat: add todo reminder feature`

### Ausnahme
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
- Relevante Tests laufen (falls vorhanden)

---

## Optional (Empfohlen für später)

- Branch Protection Rules aktivieren
- PR Templates nutzen
- CI Checks (Build / Lint / Tests)

---
