import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, Phone, Mail, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../db/db';
import { useStore } from '../store/useStore';

const STATUS_LABEL: Record<string, string> = { backlog: 'Backlog', doing: 'In Arbeit', done: 'Erledigt' };
const STATUS_CLASS: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  doing: 'bg-primary-50 text-primary-600',
  done: 'bg-green-50 text-green-600',
};

function now(): string {
  return new Date().toISOString().slice(0, 16);
}

// ─── Generate Todo Mini-Form ──────────────────────────────────────────────────

function GenerateTodoForm({
  projectId,
  commId,
  onDone,
}: {
  projectId: number;
  commId: number;
  onDone: () => void;
}) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const todoId = await db.todos.add({
      title: title.trim(),
      status: 'backlog',
      deadline: deadline || undefined,
      projectId,
      commId,
    });
    await db.communications.update(commId, { generatedTodoId: todoId as number });
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 p-3 bg-primary-50 border border-primary-100 rounded-lg flex flex-col gap-2"
    >
      <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Neue Frist</p>
      <input
        autoFocus
        type="text"
        placeholder="Titel *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        required
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <span className="text-xs text-gray-400">Deadline (optional)</span>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition-colors"
        >
          Erstellen
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── Communication Form ───────────────────────────────────────────────────────

function AddCommunicationForm({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'In' | 'Out'>('In');
  const [medium, setMedium] = useState<'Mail' | 'Phone'>('Mail');
  const [timestamp, setTimestamp] = useState(now());
  const [content, setContent] = useState('');
  const [personId, setPersonId] = useState<string>('');

  const persons = useLiveQuery(() => db.persons.orderBy('name').toArray(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await db.communications.add({
      type,
      medium,
      timestamp,
      content: content.trim(),
      personId: personId ? Number(personId) : undefined,
      projectId,
    });
    setContent('');
    setPersonId('');
    setTimestamp(now());
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 mt-1"
      >
        <Plus size={15} />
        Kommunikation erfassen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-3">
      <div className="flex gap-4">
        {/* Type */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">Richtung</span>
          <div className="flex gap-1">
            {(['In', 'Out'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setType(v)}
                className={clsx(
                  'px-3 py-1 text-xs rounded-md border transition-colors',
                  type === v
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {v === 'In' ? 'Eingehend' : 'Ausgehend'}
              </button>
            ))}
          </div>
        </div>
        {/* Medium */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 font-medium">Medium</span>
          <div className="flex gap-1">
            {(['Mail', 'Phone'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMedium(v)}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1 text-xs rounded-md border transition-colors',
                  medium === v
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {v === 'Mail' ? <Mail size={11} /> : <Phone size={11} />}
                {v === 'Mail' ? 'E-Mail' : 'Telefon'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-gray-400" />
        <input
          type="datetime-local"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Person */}
      <select
        value={personId}
        onChange={(e) => setPersonId(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      >
        <option value="">— Kein Kontakt —</option>
        {persons?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Content */}
      <textarea
        placeholder="Inhalt / Notiz *"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
        required
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { selectedProjectId, setSelectedProjectId } = useStore();
  const [generateForCommId, setGenerateForCommId] = useState<number | null>(null);

  const project = useLiveQuery(
    () => (selectedProjectId != null ? db.projects.get(selectedProjectId) : undefined),
    [selectedProjectId]
  );
  const todos = useLiveQuery(
    () =>
      selectedProjectId != null
        ? db.todos.where('projectId').equals(selectedProjectId).toArray()
        : [],
    [selectedProjectId]
  );
  const communications = useLiveQuery(
    () =>
      selectedProjectId != null
        ? db.communications
            .where('projectId')
            .equals(selectedProjectId)
            .reverse()
            .sortBy('timestamp')
        : [],
    [selectedProjectId]
  );
  const persons = useLiveQuery(() => db.persons.toArray(), []);

  if (!project) return null;

  const personMap = Object.fromEntries((persons ?? []).map((p) => [p.id!, p.name]));

  return (
    <div className="max-w-3xl">
      {/* Back + Header */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => setSelectedProjectId(null)}
          className="mt-0.5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
          {project.deadline && (
            <p className="text-sm text-gray-400 mt-0.5">
              Deadline: {new Date(project.deadline).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      </div>

      {/* ── To-Dos ── */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          To-Dos
        </h3>
        {todos?.length === 0 ? (
          <p className="text-sm text-gray-400">Keine To-Dos für dieses Projekt.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs">Titel</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs">Status</th>
                <th className="text-left py-2 font-medium text-gray-500 text-xs">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {todos?.map((todo) => (
                <tr key={todo.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-900">{todo.title}</td>
                  <td className="py-2 pr-4">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CLASS[todo.status])}>
                      {STATUS_LABEL[todo.status]}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">
                    {todo.deadline ? new Date(todo.deadline).toLocaleDateString('de-DE') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Kommunikation ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Kommunikation
        </h3>

        <AddCommunicationForm projectId={selectedProjectId!} />

        <div className="mt-4 flex flex-col gap-3">
          {communications?.length === 0 && (
            <p className="text-sm text-gray-400">Noch keine Einträge.</p>
          )}
          {communications?.map((comm) => (
            <div key={comm.id} className="border border-gray-100 rounded-lg p-3">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                {/* Direction */}
                <span
                  className={clsx(
                    'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                    comm.type === 'In'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-orange-50 text-orange-600'
                  )}
                >
                  {comm.type === 'In' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                  {comm.type === 'In' ? 'Eingehend' : 'Ausgehend'}
                </span>
                {/* Medium */}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {comm.medium === 'Mail' ? <Mail size={11} /> : <Phone size={11} />}
                  {comm.medium === 'Mail' ? 'E-Mail' : 'Telefon'}
                </span>
                {/* Person */}
                {comm.personId && personMap[comm.personId] && (
                  <span className="text-xs text-gray-500">{personMap[comm.personId]}</span>
                )}
                {/* Timestamp */}
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(comm.timestamp).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {/* Content */}
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comm.content}</p>
              {/* Footer */}
              <div className="mt-2 flex items-center gap-3">
                {comm.generatedTodoId ? (
                  <span className="text-xs text-green-600">✓ Frist angelegt</span>
                ) : (
                  <button
                    onClick={() =>
                      setGenerateForCommId(generateForCommId === comm.id ? null : comm.id!)
                    }
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    + Frist generieren
                  </button>
                )}
              </div>
              {/* Inline todo form */}
              {generateForCommId === comm.id && (
                <GenerateTodoForm
                  projectId={selectedProjectId!}
                  commId={comm.id!}
                  onDone={() => setGenerateForCommId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
