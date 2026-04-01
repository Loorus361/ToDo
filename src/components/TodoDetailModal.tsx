import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Calendar, AlignLeft, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { db, type Todo } from '../db/db';
import type { KanbanStatus } from '../hooks/useKanbanLogic';

const STATUS_OPTIONS: { value: KanbanStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'backlog-low', label: 'Ohne Prio' },
  { value: 'doing', label: 'In Arbeit' },
  { value: 'done', label: 'Erledigt' },
  { value: 'archived', label: 'Archiviert' },
];

const STATUS_ACTIVE_CLASS: Record<KanbanStatus, string> = {
  backlog: 'bg-gray-700 text-white',
  'backlog-low': 'bg-gray-400 text-white',
  doing: 'bg-yellow-400 text-white',
  done: 'bg-green-500 text-white',
  archived: 'bg-gray-200 text-gray-500',
};

interface Props {
  todoId: number;
  onClose: () => void;
}

export function TodoDetailModal({ todoId, onClose }: Props) {
  const todo = useLiveQuery(() => db.todos.get(todoId), [todoId]);
  const projects = useLiveQuery(() => db.projects.orderBy('title').toArray(), []);

  // Lokale Felder für controlled inputs (sync mit DB beim blur/change)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Lokale Felder initialisieren sobald todo geladen
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? '');
    }
  }, [todo?.id]); // nur bei Wechsel des Todos re-initialisieren

  // ESC schließt das Modal
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);

  if (!todo) return null;

  const projectTitle = projects?.find((p) => p.id === todo.projectId)?.title;

  async function saveField(field: Partial<Todo>) {
    await db.todos.update(todoId, field);
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status-Pill */}
            <span
              className={clsx(
                'text-xs font-semibold px-2.5 py-0.5 rounded-full',
                STATUS_ACTIVE_CLASS[todo.status as KanbanStatus]
              )}
            >
              {STATUS_OPTIONS.find((s) => s.value === todo.status)?.label ?? todo.status}
            </span>
            {/* Projekt-Badge */}
            {projectTitle && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 font-medium">
                {projectTitle}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body (scrollbar) ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Titel */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && saveField({ title: title.trim() })}
              className="w-full text-lg font-semibold text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:border-primary-300 focus:outline-none pb-1 transition-colors bg-transparent"
              placeholder="Titel"
            />
          </div>

          {/* Status-Wechsler */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => saveField({ status: opt.value })}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                    todo.status === opt.value
                      ? STATUS_ACTIVE_CLASS[opt.value]
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Projekt */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              <FolderOpen size={12} />
              Projekt
            </label>
            <select
              value={todo.projectId ?? ''}
              onChange={(e) =>
                saveField({ projectId: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">— Kein Projekt —</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline + Startdatum */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                <Calendar size={12} />
                Deadline
              </label>
              <input
                type="date"
                value={todo.deadline ?? ''}
                onChange={(e) => saveField({ deadline: e.target.value || undefined })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                <Calendar size={12} />
                Startdatum
              </label>
              <input
                type="date"
                value={todo.startDate ?? ''}
                onChange={(e) => saveField({ startDate: e.target.value || undefined })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Beschreibung */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              <AlignLeft size={12} />
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => saveField({ description: description || undefined })}
              rows={4}
              placeholder="Notizen, Details…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
