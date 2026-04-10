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

Wenn `beta` das falsche Remote tracked:

```bash
git branch --set-upstream-to=origin/beta beta
```

### 2. Commit kurz ansehen

```bash
git show 4d458e37384f92159b36a8c94d1a42b30e6f0d70 -- AGENTS.md
```

### 3. Cherry-pick ausfuehren

```bash
git cherry-pick 4d458e37384f92159b36a8c94d1a42b30e6f0d70
```

### 4. Ergebnis kontrollieren

```bash
git status -sb
git show --stat
```

Sinnvoll ist auch:

```bash
git diff HEAD~1 HEAD -- AGENTS.md
```

### 5. Nach `origin/beta` pushen

```bash
git push origin beta
```

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

Wenn du abbrechen willst:

```bash
git cherry-pick --abort
```

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
