// Monatskalender für Fälligkeiten, Wiedervorlagen, Projekte und Meilensteine
'use client';

import { ChevronLeft, ChevronRight, Diamond } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CalendarEntry } from '../types';
import { localDateKey } from '../lib/domain';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function displayDate(key: string): string {
  return dateFromKey(key).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
}

interface CalendarPanelProps {
  entries: CalendarEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenEntry: (entry: CalendarEntry) => void;
}

export function CalendarPanel({ entries, selectedDate, onSelectDate, onOpenEntry }: CalendarPanelProps) {
  const selected = dateFromKey(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const today = localDateKey();

  const days = useMemo(() => {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
    return map;
  }, [entries]);

  const selectedEntries = entriesByDate.get(selectedDate) ?? [];

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <button type="button" onClick={() => changeMonth(-1)} className="icon-button" aria-label="Vorheriger Monat">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-slate-900">
          {visibleMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h2>
        <button type="button" onClick={() => changeMonth(1)} className="icon-button" aria-label="Nächster Monat">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((weekday) => <div key={weekday} className="pb-2 text-xs font-medium text-slate-500">{weekday}</div>)}
        {days.map((date) => {
          const key = localDateKey(date);
          const dayEntries = entriesByDate.get(key) ?? [];
          const outside = date.getMonth() !== visibleMonth.getMonth();
          const active = key === selectedDate;
          const isToday = key === today;
          return (
            <button
              type="button"
              key={key}
              onClick={() => onSelectDate(key)}
              className={`calendar-day ${outside ? 'calendar-day-outside' : ''} ${active ? 'calendar-day-selected' : ''} ${isToday ? 'calendar-day-today' : ''}`}
              aria-label={`${displayDate(key)}, ${dayEntries.length} Einträge`}
            >
              <span>{date.getDate()}</span>
              <span className="flex h-2 items-center justify-center gap-0.5" aria-hidden="true">
                {dayEntries.slice(0, 3).map((entry) => (
                  entry.kind === 'milestone' || entry.kind === 'project'
                    ? <Diamond key={entry.id} size={7} fill={entry.color} color={entry.color} />
                    : <span key={entry.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Fällig am {displayDate(selectedDate)}</h3>
        {selectedEntries.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">Für diesen Tag ist nichts eingetragen.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {selectedEntries.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={() => onOpenEntry(entry)}
                className="flex w-full items-start gap-3 py-3 text-left"
              >
                <span className={`mt-1.5 h-2.5 w-2.5 flex-none ${entry.kind === 'project' || entry.kind === 'milestone' ? 'rotate-45 rounded-sm' : 'rounded-full'}`} style={{ backgroundColor: entry.color }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">{entry.title}</span>
                  <span className="block text-xs text-slate-400">
                    {entry.kind === 'todo' ? 'Aufgabe' : entry.kind === 'follow-up' ? 'Wiedervorlage' : entry.kind === 'project' ? 'Projekt' : 'Meilenstein'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
