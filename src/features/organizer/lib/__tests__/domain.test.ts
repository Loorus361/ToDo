// Tests für Ansichten, Kalender und Projektfortschritt der persönlichen App
import { describe, expect, it } from 'vitest';
import {
  buildCalendarEntries,
  calculateProjectProgress,
  getNextMilestone,
  matchesTodoView,
  weekBounds,
} from '../domain';
import type { MilestoneItem, ProjectItem, TodoItem } from '../../types';

const NOW = new Date(2026, 7, 12, 9, 0);

function todo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: 'todo-1', title: 'Aufgabe', notes: '', status: 'open', dueDate: null, dueTime: null,
    followUpDate: null, projectId: null, tagIds: [], createdAt: '2026-08-01', updatedAt: '2026-08-01', completedAt: null,
    ...overrides,
  };
}

function project(overrides: Partial<ProjectItem> = {}): ProjectItem {
  return {
    id: 'project-1', name: 'Planung', description: '', status: 'active', dueDate: null,
    tagIds: [], createdAt: '2026-08-01', updatedAt: '2026-08-01', ...overrides,
  };
}

function milestone(overrides: Partial<MilestoneItem> = {}): MilestoneItem {
  return {
    id: 'milestone-1', projectId: 'project-1', title: 'Meilenstein', notes: '', dueDate: null,
    done: false, sortOrder: 0, createdAt: '2026-08-01', updatedAt: '2026-08-01', completedAt: null, ...overrides,
  };
}

describe('Aufgabenansichten', () => {
  it('berechnet die Arbeitswoche von Montag bis Sonntag', () => {
    expect(weekBounds(NOW)).toEqual({ start: '2026-08-10', end: '2026-08-16' });
  });

  it('zeigt heute fällige und überfällige Aufgaben in Heute', () => {
    expect(matchesTodoView(todo({ dueDate: '2026-08-12' }), 'today', NOW)).toBe(true);
    expect(matchesTodoView(todo({ dueDate: '2026-08-10' }), 'today', NOW)).toBe(true);
    expect(matchesTodoView(todo({ dueDate: '2026-08-13' }), 'today', NOW)).toBe(false);
  });

  it('holt wartende Aufgaben über die Wiedervorlage zurück ohne ihren Status zu ändern', () => {
    const waiting = todo({ status: 'waiting', followUpDate: '2026-08-12' });
    expect(matchesTodoView(waiting, 'today', NOW)).toBe(true);
    expect(waiting.status).toBe('waiting');
  });

  it('schließt erledigte Aufgaben aus Zeitansichten aus', () => {
    expect(matchesTodoView(todo({ status: 'done', dueDate: '2026-08-12' }), 'today', NOW)).toBe(false);
  });
});

describe('Projektfortschritt', () => {
  it('berechnet abgeschlossene Meilensteine', () => {
    expect(calculateProjectProgress([milestone({ done: true }), milestone({ id: 'm2' }), milestone({ id: 'm3' })]))
      .toEqual({ done: 1, total: 3, percent: 33 });
  });

  it('findet den frühesten offenen Meilenstein', () => {
    expect(getNextMilestone([
      milestone({ id: 'later', dueDate: '2026-09-01' }),
      milestone({ id: 'first', dueDate: '2026-08-20' }),
    ])?.id).toBe('first');
  });
});

describe('Kalender', () => {
  it('vereint Aufgaben, Wiedervorlagen, Projekte und Meilensteine', () => {
    const entries = buildCalendarEntries(
      [todo({ dueDate: '2026-08-12', followUpDate: '2026-08-13' })],
      [project({ dueDate: '2026-08-14' })],
      [milestone({ dueDate: '2026-08-15' })],
      [],
    );
    expect(entries.map((entry) => entry.kind)).toEqual(['todo', 'follow-up', 'project', 'milestone']);
  });

  it('zeigt abgeschlossene Inhalte nicht mehr im Kalender', () => {
    const entries = buildCalendarEntries(
      [todo({ status: 'done', dueDate: '2026-08-12' })],
      [project({ status: 'archived', dueDate: '2026-08-14' })],
      [milestone({ done: true, dueDate: '2026-08-15' })],
      [],
    );
    expect(entries).toEqual([]);
  });
});
