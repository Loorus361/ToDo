// Detail-Modal für ein Todo: Bearbeitungsformular, Kommunikations-Log und Verknüpfungen
import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  X, Calendar, AlignLeft, FolderOpen, Star, Link, ChevronDown, ChevronUp,
  Phone, Mail, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  getTodo,
  getTodoCommunication,
  getTodoPerson,
  listTodoProjects,
  type Todo,
  updateTodo,
} from '../data/todos';

type StorableStatus = 'today' | 'backlog' | 'doing' | 'done' | 'archived';

const STATUS_OPTIONS: { value: StorableStatus; label: string }[] = [
  { value: 'today',     label: 'Heute' },
  { value: 'backlog',   label: 'Backlog' },
  { value: 'doing',     label: 'In Arbeit' },
  { value: 'done',      label: 'Erledigt' },
  { value: 'archived',  label: 'Archiviert' },
];

const STATUS_ACTIVE_CLASS: Record<StorableStatus, string> = {
  today:    'bg-orange-400 text-white',
  backlog:  'bg-gray-700 text-white',
  doing:    'bg-yellow-400 text-white',
  done:     'bg-green-500 text-white',
  archived: 'bg-gray-200 text-gray-500',
};

interface Props {
  todoId: number;
  onClose: () => void;
}

export function TodoDetailModal({ todoId, onClose }: Props) {
  const todo = useLiveQuery(() => getTodo(todoId), [todoId]);
  const projects = useLiveQuery(() => listTodoProjects(), []);
  const linkedComm = useLiveQuery(
    () => todo?.commId ? getTodoCommunication(todo.commId) : undefined,
    [todo?.commId]
  );
  const linkedPerson = useLiveQuery(
    () => linkedComm?.personId ? getTodoPerson(linkedComm.personId) : undefined,
    [linkedComm?.personId]
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showComm, setShowComm] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? '');
    }
  }, [todo?.id]);

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
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === (todo.status as StorableStatus))?.label ?? todo.status;

  async function saveField(field: Partial<Todo>) {
    await updateTodo(todoId, field);
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
            <span className={clsx('text-xs font-semibold px-2.5 py-0.5 rounded-full', STATUS_ACTIVE_CLASS[todo.status as StorableStatus] ?? 'bg-gray-200 text-gray-500')}>
              {statusLabel}
            </span>
            {projectTitle && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 font-medium">
                {projectTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* Prio-Toggle */}
            <button
              onClick={() => saveField({ prio: !todo.prio })}
              className={clsx('p-1.5 rounded-lg transition-colors',
                todo.prio ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'
              )}
              title="Priorität"
            >
              <Star size={16} fill={todo.prio ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body (scrollbar) ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Titel */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && saveField({ title: title.trim() })}
            className="w-full text-lg font-semibold text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:border-primary-300 focus:outline-none pb-1 transition-colors bg-transparent"
            placeholder="Titel"
          />

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
                    (todo.status as StorableStatus) === opt.value
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
              onChange={(e) => saveField({ projectId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">— Kein Projekt —</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
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

          {/* Verknüpfte Kommunikation */}
          {linkedComm && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowComm((v) => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <Link size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-1">
                  Verknüpfte Kommunikation
                </span>
                {showComm ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
              </button>
              {showComm && (
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                      linkedComm.type === 'In' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600')}>
                      {linkedComm.type === 'In' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {linkedComm.type === 'In' ? 'Eingehend' : 'Ausgehend'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {linkedComm.medium === 'Mail' ? <Mail size={10} /> : <Phone size={10} />}
                      {linkedComm.medium === 'Mail' ? 'E-Mail' : 'Telefon'}
                    </span>
                    {linkedPerson && (
                      <span className="text-xs font-medium text-gray-600">{linkedPerson.name}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(linkedComm.timestamp).toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                    {linkedComm.content}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
