# `beta` auf den Stand von `main` zuruecksetzen

## Alle Befehle zum Zuruecksetzen

Wenn `beta` lokal und auf `origin/beta` exakt auf den Stand von `main` gesetzt werden soll:

```bash
git status -sb
git switch beta
git fetch origin main beta
git reset --hard origin/main
git push --force-with-lease origin beta
```

Wenn nur der lokale Branch `beta` zurueckgesetzt werden soll, aber noch kein Push erfolgen soll:

```bash
git status -sb
git switch beta
git fetch origin main
git reset --hard origin/main
```

## Ziel

`beta` soll wieder exakt denselben Commit-Stand haben wie `main`.

Wichtig:
- Das ist kein Merge.
- Das ist kein Cherry-pick.
- Die bisherige Branch-Historie von `beta` wird dabei verworfen, sobald der Force-Push erfolgt.

## Was die Befehle tun

### 1. Status pruefen

```bash
git status -sb
```

Prueft, ob dein Arbeitsverzeichnis sauber ist.

Wenn hier noch uncommittete Aenderungen auftauchen, solltest du den Reset nicht blind ausfuehren.

### 2. Auf `beta` wechseln

```bash
git switch beta
```

Der Reset muss auf dem Branch ausgefuehrt werden, der wirklich ueberschrieben werden soll.

### 3. Remote-Stand holen

```bash
git fetch origin main beta
```

Holt den aktuellen Stand von `origin/main` und `origin/beta`, ohne lokal etwas zu mergen.

Dadurch arbeitest du mit einem frischen Remote-Stand und setzt nicht versehentlich auf einen veralteten lokalen Branch zurueck.

### 4. Lokalen Branch `beta` hart auf `main` setzen

```bash
git reset --hard origin/main
```

Danach zeigt dein lokaler Branch `beta` exakt auf denselben Commit wie `origin/main`.

Das bedeutet:
- alle Commits, die nur auf `beta` lagen, sind lokal nicht mehr auf der Branch-Spitze
- alle uncommitteten Aenderungen im Working Tree werden verworfen

### 5. Remote-Branch `beta` ueberschreiben

```bash
git push --force-with-lease origin beta
```

Erst dieser Schritt macht das Zuruecksetzen auch auf GitHub sichtbar.

`--force-with-lease` ist bewusst besser als ein blankes `--force`, weil Git noch prueft, ob sich der Remote-Branch seit deinem letzten Fetch unerwartet veraendert hat.

## Do And Don'ts

### Do

- Vorher mit `git status -sb` pruefen, ob dein Arbeitsverzeichnis sauber ist.
- Vorher mit `git fetch origin main beta` den aktuellen Remote-Stand holen.
- Immer kontrollieren, dass du wirklich auf `beta` stehst.
- Fuer das Ueberschreiben des Remote-Branches `git push --force-with-lease origin beta` verwenden.
- Vor dem Force-Push kurz pruefen, ob auf `beta` noch etwas liegt, das bewusst erhalten werden soll.

Sinnvolle Pruefung davor:

```bash
git log --oneline origin/main..origin/beta
```

Wenn hier noch Commits auftauchen, existieren auf `beta` noch Aenderungen, die nicht in `main` sind.

### Don't

- Nicht auf `main` stehen und dann `reset --hard` ausfuehren.
- Nicht mit uncommitteten lokalen Aenderungen arbeiten, wenn du sie noch brauchst.
- Nicht blind `git push --force origin beta` benutzen, wenn `--force-with-lease` ausreicht.
- Nicht zuruecksetzen, wenn dir unklar ist, ob die `beta`-Commits noch benoetigt werden.

## Empfohlene Kurzpruefung nach dem Reset

```bash
git status -sb
git rev-parse beta
git rev-parse origin/main
```

Wenn `beta` und `origin/main` dieselbe Commit-ID ausgeben, zeigt dein lokaler `beta`-Branch auf denselben Stand wie `main`.

Nach dem Push kannst du zusaetzlich pruefen:

```bash
git fetch origin beta
git rev-parse beta
git rev-parse origin/beta
```

Wenn beide gleich sind, ist auch der Remote-Branch erfolgreich ueberschrieben worden.

## Wann dieser Weg sinnvoll ist

Dieser Reset ist sinnvoll, wenn `beta` bewusst wieder auf den stabilen Stand von `main` gebracht werden soll, zum Beispiel:

- nach Experimenten auf `beta`, die komplett verworfen werden sollen
- wenn `beta` wieder als sauberer Ausgangspunkt fuer neue Arbeit dienen soll
- wenn klar ist, dass die bisherigen `beta`-Commits nicht mehr benoetigt werden

## Wann dieser Weg nicht sinnvoll ist

Nicht geeignet ist dieser Weg, wenn:

- nur einzelne Commits rueckgaengig gemacht werden sollen
- Inhalte aus `beta` teilweise erhalten bleiben sollen
- stattdessen ein normaler Abgleich per Merge oder Cherry-pick sinnvoller waere

## Warum `beta` nach einem PR trotz identischem Code hinter `main` sein kann

Das passiert in der Praxis sehr haeufig nach `Squash and merge`.

### Was bei `Squash and merge` passiert

Beim Merge auf GitHub werden nicht die vorhandenen Branch-Commits 1:1 nach `main` uebernommen.
Stattdessen baut GitHub aus allen Aenderungen des PRs einen neuen einzelnen Commit auf `main`.

Dadurch gilt:

- der Codeinhalt auf `main` entspricht dem PR
- die Commit-History auf `main` ist aber nicht dieselbe wie auf `beta`
- `main` hat einen neuen Squash-Commit, den `beta` nicht hat

Genau deshalb kann GitHub danach melden:

- `beta is 1 commit behind main`

obwohl die Dateien inhaltlich schon identisch sind.

### Warum Git das so anzeigt

Git vergleicht nicht nur den aktuellen Codeinhalt, sondern vor allem die Commit-Historie.

Wenn `main` den neuen Squash-Commit hat und `beta` nicht, dann ist `beta` aus Git-Sicht hinter `main`, auch wenn der Dateistand gleich aussieht.

### Warum der Reset dann oft sinnvoll ist

Wenn `beta` nach dem PR einfach wieder derselbe Ausgangspunkt wie `main` sein soll, ist ein Reset von `beta` auf `main` meist der sauberste Weg.

Damit:

- ist der Code wieder identisch
- ist auch die Branch-Historie wieder sauber synchron
- startet die naechste Arbeit auf `beta` wieder von genau demselben Stand wie `main`

## Handlungsempfehlung fuer dieses Repo: welche Merge-Art wann

Fuer dieses Repo ist die Wahl der Merge-Art vor allem eine Frage von Lesbarkeit der History und davon, ob `beta` danach bewusst wieder auf `main` zurueckgesetzt werden soll.

### `Squash and merge`: Standard fuer kleine bis normale Feature-PRs

Empfehlung:
- verwenden, wenn ein PR aus mehreren Zwischen-Commits besteht
- verwenden, wenn die `main`-History moeglichst kompakt und lesbar bleiben soll
- verwenden, wenn `beta` danach ohnehin wieder auf `main` gesetzt wird

Vorteile:
- `main` bleibt aufgeraeumt
- WIP-Commits und kleine Zwischenstaende landen nicht in `main`
- ein Feature oder Fix ist in `main` meist als ein klarer Commit sichtbar

Nachteile:
- `beta` kann danach historisch hinter `main` sein, obwohl der Code gleich ist
- danach ist oft ein Reset von `beta` auf `main` sinnvoll

Pragmatische Empfehlung fuer dieses Repo:
- fuer normale PRs von `beta` nach `main` ist `Squash and merge` meistens die beste Wahl
- danach `beta` bewusst wieder auf `main` zuruecksetzen, wenn `beta` der Arbeitsbranch fuer die naechste Runde bleiben soll

### `Merge commit`: nur wenn die Original-Commitstruktur bewusst erhalten bleiben soll

Empfehlung:
- verwenden, wenn mehrere Commits im PR bewusst getrennt und in `main` sichtbar bleiben sollen
- verwenden, wenn genau diese Commit-Historie spaeter noch wichtig fuer Nachvollziehbarkeit oder Rueckverfolgung ist

Vorteile:
- die originalen Commits bleiben erhalten
- Branch und Zielbranch driften historisch oft weniger kuenstlich auseinander

Nachteile:
- `main` wird schneller unuebersichtlich
- bei vielen kleinen AI- oder Zwischen-Commits sinkt die Lesbarkeit der History

Pragmatische Empfehlung fuer dieses Repo:
- eher Ausnahme statt Standard
- sinnvoll nur bei groesseren Aenderungen, bei denen die einzelnen Commits absichtlich sauber strukturiert wurden und genau so erhalten bleiben sollen

### `Rebase and merge`: nur selten sinnvoll fuer dieses Repo

Empfehlung:
- nur verwenden, wenn eine lineare History ohne Merge-Commit wichtig ist und die Commitreihe im PR bereits sehr sauber ist

Vorteile:
- lineare History
- keine Merge-Commits

Nachteile:
- erzeugt ebenfalls neue Commit-IDs
- ist fuer alltaegliche Arbeit oft weniger transparent
- bringt hier meist keinen klaren Vorteil gegenueber `Squash and merge`

Pragmatische Empfehlung fuer dieses Repo:
- eher nicht der Standardweg
- nur dann nutzen, wenn du bewusst mehrere sauber vorbereitete Einzel-Commits linear in `main` uebernehmen willst

## Kurzempfehlung fuer dieses Repo

Wenn du schnell und sauber arbeiten willst:

- Feature auf `beta` entwickeln
- PR von `beta` nach `main`
- in der Regel `Squash and merge`
- danach `beta` wieder auf `main` zuruecksetzen

Wenn die Commit-Historie eines PRs selbst wertvoll ist:

- nur dann `Merge commit` oder in seltenen Faellen `Rebase and merge` in Betracht ziehen
