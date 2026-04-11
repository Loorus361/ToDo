# Cherry-Pick: `AGENTS.md` von `main` nach `beta`

## Ziel

Den Commit `4d458e37384f92159b36a8c94d1a42b30e6f0d70` auf `beta` uebernehmen.

Der Commit aendert nur `AGENTS.md`.

## Checkliste

- [ ] Arbeitsverzeichnis ist sauber
- [ ] Du bist auf dem Branch `beta`
- [ ] `beta` tracked `origin/beta`
- [ ] Der Commit-Inhalt wurde kurz geprueft
- [ ] Cherry-pick wurde ausgefuehrt
- [ ] Ergebnis wurde kontrolliert
- [ ] `beta` wurde gepusht

## Empfohlener Ablauf

### 1. Status pruefen

```bash
git status -sb
```

Erwartet:

```bash
## beta...origin/beta
```

Wenn du noch nicht auf `beta` bist:

```bash
git switch beta
git pull --ff-only origin beta
```

Erklärung:
- `git switch <ziel-branch>`: wechselt auf den Ziel-Branch
- `git pull --ff-only origin <ziel-branch>`: holt den neuesten Stand vom Remote, ohne Merge-Commit

Wenn `beta` das falsche Remote tracked:

```bash
git branch --set-upstream-to=origin/beta beta
```

### 2. Commit kurz ansehen

```bash
git show 4d458e37384f92159b36a8c94d1a42b30e6f0d70 -- AGENTS.md
```

Erklärung:
- `git log --oneline -- <datei>`: zeigt kompakte Commit-Historie für eine bestimmte Datei

### Optional: Commit-Historie ansehen

```bash
git log --oneline -- AGENTS.md
```

- `git show <commit-hash>`: zeigt die genauen Änderungen dieses Commits

### 3. Cherry-pick ausfuehren

```bash
git cherry-pick 4d458e37384f92159b36a8c94d1a42b30e6f0d70
```

Erklärung:
- `git cherry-pick <commit-hash>`: übernimmt genau diesen Commit auf den aktuellen Branch

### 4. Ergebnis kontrollieren

```bash
git status -sb
git show --stat
```

Erklärung:
- `git status -sb`: zeigt kurz den Status und Branch-Tracking
- `git show --stat`: zeigt den letzten Commit inkl. geänderter Dateien

Sinnvoll ist auch:

```bash
git diff HEAD~1 HEAD -- AGENTS.md
```

- `git diff HEAD~1 HEAD -- <datei>`: zeigt die Änderung des letzten Commits für eine bestimmte Datei

### 5. Nach `origin/beta` pushen

```bash
git push origin beta
```

Erklärung:
- `git push origin <ziel-branch>`: überträgt deine Änderungen zum Remote-Repository

## Typische Fallstricke

### 1. Arbeitsverzeichnis ist nicht sauber

Beispiel:

```bash
error: your local changes would be overwritten by cherry-pick
```

Loesung:

- Entweder erst committen
- oder temporaer staschen

```bash
git stash push -u -m "before cherry-pick agents"
git cherry-pick 4d458e37384f92159b36a8c94d1a42b30e6f0d70
git stash pop
```

Erklärung:
- `git stash push -u`: speichert lokale Änderungen temporär (inkl. untracked files)
- `git stash pop`: stellt die Änderungen wieder her

### 2. Konflikt in `AGENTS.md`

Unwahrscheinlich, aber moeglich, wenn `AGENTS.md` auf `beta` inzwischen ebenfalls geaendert wurde.

Erkennen:

```bash
git status
```

Dann siehst du `both modified: AGENTS.md`.

Loesung:

1. Datei oeffnen
2. Konfliktmarker `<<<<<<<`, `=======`, `>>>>>>>` aufloesen
3. Datei speichern
4. fortsetzen:

```bash
git add AGENTS.md
git cherry-pick --continue
```

Erklärung:
- `git add <datei>`: markiert Konflikt als gelöst
- `git cherry-pick --continue`: setzt den Cherry-Pick fort

Wenn du abbrechen willst:

```bash
git cherry-pick --abort
```

- `git cherry-pick --abort`: bricht den Vorgang ab und stellt den alten Zustand wieder her

### 3. Falscher Branch oder falsches Tracking

Beispiel:

```bash
## beta...origin/main
```

Dann ist `beta` lokal falsch konfiguriert.

Loesung:

```bash
git branch --set-upstream-to=origin/beta beta
git pull --ff-only origin beta
```

### 4. Commit wurde schon uebernommen

Beispiel:

```bash
The previous cherry-pick is now empty
```

Das bedeutet meist: die Aenderung ist schon auf `beta`.

Pruefen:

```bash
git log --oneline -- AGENTS.md
```

Wenn der Inhalt schon vorhanden ist, kannst du den Cherry-pick abbrechen oder den leeren Cherry-pick verwerfen:

```bash
git cherry-pick --abort
```

### 5. Push wird abgelehnt

Beispiel:

```bash
! [rejected] beta -> beta (non-fast-forward)
```

Loesung:

```bash
git pull --ff-only origin beta
git push origin beta
```

Erklärung:
- `git pull --ff-only`: synchronisiert erst lokal mit Remote
- `git push`: versucht danach erneut zu pushen

Wenn `--ff-only` nicht geht, erst schauen, was auf `origin/beta` passiert ist:

```bash
git log --oneline --decorate --graph beta..origin/beta
git log --oneline --decorate --graph origin/beta..beta
```

## Schnelle Minimalversion

Wenn alles sauber ist, reicht meistens:

```bash
git switch beta
git pull --ff-only origin beta
git cherry-pick 4d458e37384f92159b36a8c94d1a42b30e6f0d70
git push origin beta
```

## Wenn du nach dem Gassi direkt weitermachen willst

Starte mit:

```bash
cd /Users/carlosanderssohn/Claude/Arbeit/ToDo-Manager
git status -sb
```

Wenn dort `## beta...origin/beta` steht, kannst du direkt mit dem Cherry-pick weitermachen.
