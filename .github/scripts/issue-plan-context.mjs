import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const MAX_KEYWORDS = 8;
const MAX_FILES = 6;
const MAX_LINES = 200;
const CONTEXT_OUTPUT = 'issue-plan-context.json';
const PROMPT_OUTPUT = 'issue-plan-prompt.txt';

const stopwords = new Set([
  'aber', 'alles', 'also', 'and', 'auch', 'aus', 'bei', 'bitte', 'bug', 'das', 'dass', 'dem',
  'den', 'der', 'des', 'die', 'dies', 'diese', 'dieser', 'doch', 'ein', 'eine', 'einem', 'einen',
  'einer', 'eines', 'er', 'es', 'eur', 'eure', 'fuer', 'feature', 'funktion', 'hier', 'http',
  'https', 'ich', 'ihr', 'ihre', 'im', 'in', 'ist', 'it', 'kein', 'keine', 'mit', 'nach', 'nicht',
  'noch', 'oder', 'ohne', 'please', 'pwa', 'repro', 'schritt', 'schritte', 'sein', 'sich', 'sie',
  'sind', 'soll', 'sollen', 'the', 'und', 'uns', 'unter', 'use', 'verhalten', 'von', 'was', 'wenn',
  'wie', 'wir', 'wird', 'you', 'zum', 'zur',
]);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options,
  });

  const allowedExitCodes = options.allowedExitCodes ?? [0];

  if (!allowedExitCodes.includes(result.status ?? 1)) {
    const error = result.stderr?.trim() || `Command failed: ${command} ${args.join(' ')}`;
    throw new Error(error);
  }

  return result.stdout.trim();
}

function tokenize(text) {
  return Array.from(
    new Set(
      (text.toLowerCase().match(/\p{L}[\p{L}\p{N}_/-]{2,}/gu) ?? [])
        .map((token) => token.replace(/^[/_-]+|[/_-]+$/g, ''))
        .filter((token) => token.length >= 3 && !stopwords.has(token))
    )
  );
}

function extractKeywords(issue) {
  const ranked = new Map();
  const combined = [
    issue.title ?? '',
    issue.body ?? '',
    ...(issue.labels ?? []).map((label) => label.name ?? ''),
  ].join(' \n ');

  for (const token of tokenize(combined)) {
    const score = (issue.title?.toLowerCase().includes(token) ? 4 : 0)
      + ((issue.body?.toLowerCase().includes(token) ?? false) ? 2 : 0)
      + ((issue.labels ?? []).some((label) => label.name?.toLowerCase().includes(token)) ? 1 : 0)
      + token.length / 100;
    ranked.set(token, (ranked.get(token) ?? 0) + score);
  }

  return [...ranked.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, MAX_KEYWORDS)
    .map(([token]) => token);
}

function collectMatches(keywords) {
  const files = new Map();

  for (const keyword of keywords) {
    const output = run('git', [
      'grep',
      '-n',
      '-I',
      '-i',
      '--full-name',
      '-e',
      keyword,
      '--',
      'src',
      'package.json',
      'vite.config.ts',
      '.github/workflows',
    ], { allowedExitCodes: [0, 1] });

    if (!output) {
      continue;
    }

    for (const line of output.split('\n')) {
      const [file, lineNumber] = line.split(':', 3);
      const entry = files.get(file) ?? { score: 0, matches: [] };
      entry.score += file.includes(keyword) ? 5 : 1;
      entry.matches.push(`${file}:${lineNumber}`);
      files.set(file, entry);
    }
  }

  return [...files.entries()]
    .sort((left, right) => right[1].score - left[1].score)
    .slice(0, MAX_FILES)
    .map(([file, meta]) => ({ file, matches: meta.matches.slice(0, 8) }));
}

function readSnippet(file) {
  const absolutePath = path.join(process.cwd(), file);
  const content = fs.readFileSync(absolutePath, 'utf8');
  return content.split('\n').slice(0, MAX_LINES).join('\n');
}

function fallbackFiles() {
  return [
    { file: 'src/app/App.tsx', matches: [] },
    { file: 'src/app/routes/AppRoutes.tsx', matches: [] },
    { file: 'package.json', matches: [] },
    { file: 'vite.config.ts', matches: [] },
  ].filter((entry) => fs.existsSync(path.join(process.cwd(), entry.file)));
}

function buildPrompt(issue, context) {
  const issueLabels = (issue.labels ?? []).map((label) => label.name).join(', ') || 'none';
  const contextText = context.files.length > 0
    ? context.files
      .map((entry) => {
        const matchLines = entry.matches.length > 0
          ? `Matches: ${entry.matches.join(', ')}\n`
          : '';
        return `File: ${entry.file}\n${matchLines}Snippet:\n${entry.snippet}`;
      })
      .join('\n\n---\n\n')
    : 'unknown';

  return `You are a senior software engineer working on a PWA project.

Your task is to analyze a GitHub Issue and create a precise, implementation-ready plan.
Do NOT write code. Focus only on analysis and planning.

---

## Context

Repository context (partial, may be incomplete):
${contextText}

---

## Issue

Title:
${issue.title ?? 'unknown'}

Description:
${issue.body?.trim() || 'No description provided.'}

Labels:
${issueLabels}

---

## Instructions

1. Classify the issue:
   - BUG or FEATURE
   - if unclear, explain why

2. Problem Analysis:
   - what is happening?
   - which parts are involved?
   - reference files if possible

3. Implementation Plan:
   - step-by-step
   - actionable
   - mention affected files

4. Risks / Edge Cases:
   - pitfalls
   - PWA-specific (cache, service worker)

5. Validation:
   - how to test
   - manual steps

---

## Constraints

- be concise but specific
- do not hallucinate unknown files (use "unknown")
- no code output

---

## Output Format

### Type
(Bug / Feature / Unclear)

### Analysis

### Plan
1.
2.
3.

### Risks

### Validation
`;
}

const eventPath = process.env.GITHUB_EVENT_PATH;

if (!eventPath || !fs.existsSync(eventPath)) {
  throw new Error('GITHUB_EVENT_PATH is missing.');
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = event.issue;

if (!issue) {
  throw new Error('This workflow requires an issue payload.');
}

const keywords = extractKeywords(issue);
const matchedFiles = collectMatches(keywords);
const files = (matchedFiles.length > 0 ? matchedFiles : fallbackFiles()).map((entry) => ({
  ...entry,
  snippet: readSnippet(entry.file),
}));

const context = { keywords, files };
fs.writeFileSync(CONTEXT_OUTPUT, JSON.stringify(context, null, 2));
fs.writeFileSync(PROMPT_OUTPUT, buildPrompt(issue, context));
