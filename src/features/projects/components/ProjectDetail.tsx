import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft, Plus, Phone, Mail, ArrowDownLeft, ArrowUpRight, Calendar, UserPlus, Trash2,
  ChevronDown, ChevronUp, GripVertical, Pencil, Check,
} from 'lucide-react';
import {
  DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { getProjectColor } from '../../../shared/lib/projectColors';
import { TodoDetailModal } from '../../todos/components/TodoDetailModal';
import {
  createMilestone,
  createProjectCommunication,
  createProjectTodo,
  createQuickPerson,
  createTodoFromCommunication,
  deleteCommunication,
  deleteMilestone,
  deleteProjectTodo,
  getCommunication,
  getProject,
  listProjectCommunications,
  listProjectMilestones,
  listProjectPersons,
  listProjectPersonsByName,
  listProjectTodos,
  reorderMilestones,
  type Communication,
  type Milestone,
  updateCommunication,
  updateMilestone,
  updateProject,
} from '../data/projects';

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  'backlog-low': 'Ohne Prio',
  doing: 'In Arbeit',
  done: 'Erledigt',
  archived: 'Archiviert',
};
const STATUS_CLASS: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  'backlog-low': 'bg-gray-100 text-gray-400',
  doing: 'bg-primary-50 text-primary-600',
  done: 'bg-green-50 text-green-600',
  archived: 'bg-gray-100 text-gray-400',
};

function now(): string {
  return new Date().toISOString().slice(0, 16);
}

// ─── Meilenstein-Formular ─────────────────────────────────────────────────────
function AddMilestoneForm({ projectId, onDone }: { projectId: number; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createMilestone(projectId, title.trim(), notes.trim() || undefined);
    setTitle('');
    setNotes('');
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2">
      <input autoFocus type="text" placeholder="Titel *" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" required
      />
      <textarea placeholder="Notiz (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
      />
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors">
          Erstellen
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── Meilenstein-Zeile ────────────────────────────────────────────────────────
function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const [expanded, setExpanded] = useState(false);
  const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: milestone.id! });

  async function toggleDone(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    await updateMilestone(milestone.id!, { done: !milestone.done });
  }
  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Meilenstein löschen?')) return;
    await deleteMilestone(milestone.id!);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('border-b border-gray-50 last:border-0', isDragging && 'opacity-50 bg-white z-10')}
    >
      {/* Header-Zeile */}
      <div
        className="flex items-center gap-2 py-2 group cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical size={14} />
        </span>
        <input
          type="checkbox"
          checked={milestone.done}
          onChange={toggleDone}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-primary-500 cursor-pointer flex-shrink-0"
        />
        <span className={clsx('flex-1 text-sm text-gray-900 min-w-0 truncate', milestone.done && 'line-through text-gray-400')}>
          {milestone.title}
        </span>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
        {expanded ? <ChevronUp size={13} className="text-gray-300 flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-300 flex-shrink-0" />}
      </div>

      {/* Edit-Bereich */}
      {expanded && (
        <div className="pb-3 pl-10 flex flex-col gap-2">
          <input
            type="text"
            defaultValue={milestone.title}
            onBlur={(e) => e.target.value.trim() && updateMilestone(milestone.id!, { title: e.target.value.trim() })}
            onClick={(e) => e.stopPropagation()}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <textarea
            defaultValue={milestone.notes ?? ''}
            onBlur={(e) => updateMilestone(milestone.id!, { notes: e.target.value.trim() || undefined })}
            onClick={(e) => e.stopPropagation()}
            rows={2}
            placeholder="Notiz (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
        </div>
      )}
    </div>
  );
}

// ─── Schnell-Kontakt-Formular ─────────────────────────────────────────────────
function QuickAddPersonForm({ onCreated }: { onCreated: (id: number) => void; onClose: () => void }) {
  const [name, setName] = useState('');

  async function handleCreate() {
    if (!name.trim()) return;
    const id = await createQuickPerson(name.trim());
    onCreated(id as number);
  }

  return (
    <div className="flex gap-2 mt-1">
      <input
        autoFocus
        type="text"
        placeholder="Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <button
        type="button"
        onClick={handleCreate}
        className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors"
      >
        Anlegen
      </button>
    </div>
  );
}

// ─── Frist aus Kommunikation ──────────────────────────────────────────────────
function GenerateTodoForm({ projectId, commId, onDone }: { projectId: number; commId: number; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTodoFromCommunication(projectId, commId, title.trim(), deadline || undefined);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-primary-50 border border-primary-100 rounded-lg flex flex-col gap-2">
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
        <button type="submit" className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition-colors">
          Erstellen
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── Kommunikations-Bearbeitung ───────────────────────────────────────────────
function CommEditPanel({ commId, onClose }: { commId: number; onClose: () => void }) {
  const comm = useLiveQuery(() => getCommunication(commId), [commId]);
  const persons = useLiveQuery(() => listProjectPersonsByName(), []);
  const [content, setContent] = useState('');

  // Lokalen content-State initialisieren
  useState(() => { if (comm) setContent(comm.content); });

  if (!comm) return null;

  async function save(partial: Partial<Communication>) {
    await updateCommunication(commId, partial);
  }

  async function handleDelete() {
    if (!confirm('Kommunikationseintrag löschen?')) return;
    await deleteCommunication(commId);
    onClose();
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bearbeiten</p>

      {/* ★ HIER: Überschriften "Richtung" und "Medium" im Bearbeiten-Panel (CommEditPanel) */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {(['In', 'Out'] as const).map((v) => (
              <button key={v} type="button" onClick={() => save({ type: v })}
                className={clsx('px-3 py-1 text-xs rounded-md border transition-colors',
                  comm.type === v ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                {v === 'In' ? 'Eingehend' : 'Ausgehend'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {(['Mail', 'Phone'] as const).map((v) => (
              <button key={v} type="button" onClick={() => save({ medium: v })}
                className={clsx('flex items-center gap-1 px-3 py-1 text-xs rounded-md border transition-colors',
                  comm.medium === v ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                {v === 'Mail' ? <Mail size={11} /> : <Phone size={11} />}
                {v === 'Mail' ? 'E-Mail' : 'Telefon'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Datum */}
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-gray-400" />
        <input type="datetime-local" defaultValue={comm.timestamp}
          onBlur={(e) => e.target.value && save({ timestamp: e.target.value })}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Kontakt */}
      <select defaultValue={comm.personId ?? ''}
        onChange={(e) => save({ personId: e.target.value ? Number(e.target.value) : undefined })}
        className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300">
        <option value="">— Kein Kontakt —</option>
        {persons?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {/* Inhalt */}
      <textarea value={content} onChange={(e) => setContent(e.target.value)}
        onBlur={() => save({ content: content.trim() || comm.content })}
        rows={3}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
      />

      {/* Aktionen */}
      <div className="flex gap-2">
        <button type="button" onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors">
          <Check size={12} /> Fertig
        </button>
        <button type="button" onClick={handleDelete}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={12} /> Löschen
        </button>
      </div>
    </div>
  );
}

// ─── Kommunikations-Formular ──────────────────────────────────────────────────
function AddCommunicationForm({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'In' | 'Out'>('In');
  const [medium, setMedium] = useState<'Mail' | 'Phone'>('Mail');
  const [timestamp, setTimestamp] = useState(now());
  const [content, setContent] = useState('');
  const [personId, setPersonId] = useState<string>('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const persons = useLiveQuery(() => listProjectPersonsByName(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await createProjectCommunication({
      type, medium, timestamp,
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
    <form onSubmit={handleSubmit} className="mt-3 p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3">
      {/* ★ HIER: Überschriften "Richtung" und "Medium" im Neu-Anlegen-Formular (AddCommunicationForm) */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {(['In', 'Out'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setType(v)}
                className={clsx('px-3 py-1 text-xs rounded-md border transition-colors',
                  type === v ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                {v === 'In' ? 'Eingehend' : 'Ausgehend'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {(['Mail', 'Phone'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setMedium(v)}
                className={clsx('flex items-center gap-1 px-3 py-1 text-xs rounded-md border transition-colors',
                  medium === v ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                {v === 'Mail' ? <Mail size={11} /> : <Phone size={11} />}
                {v === 'Mail' ? 'E-Mail' : 'Telefon'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-gray-400" />
        <input type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Kontakt + Schnell-Anlegen */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <select value={personId} onChange={(e) => setPersonId(e.target.value)}
            className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">— Kein Kontakt —</option>
            {persons?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowQuickAdd((v) => !v)}
            title="Neuen Kontakt anlegen"
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
          >
            <UserPlus size={14} />
          </button>
        </div>
        {showQuickAdd && (
          <QuickAddPersonForm
            onCreated={(id) => { setPersonId(String(id)); setShowQuickAdd(false); }}
            onClose={() => setShowQuickAdd(false)}
          />
        )}
      </div>

      <textarea placeholder="Inhalt / Notiz *" value={content} onChange={(e) => setContent(e.target.value)} rows={3}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" required
      />

      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
          Speichern
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── To-Do-Hinzufügen-Form ────────────────────────────────────────────────────
function AddTodoInlineForm({ projectId, onDone }: { projectId: number; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createProjectTodo({
      title: title.trim(),
      status: 'backlog',
      deadline: deadline || undefined,
      projectId,
    });
    setTitle('');
    setDeadline('');
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-2">
      <input autoFocus type="text" placeholder="Titel *" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" required
      />
      <div className="flex items-center gap-2">
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <span className="text-xs text-gray-400">Deadline (optional)</span>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 transition-colors">
          Erstellen
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
}

export default function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const [generateForCommId, setGenerateForCommId] = useState<number | null>(null);
  const [editCommId, setEditCommId] = useState<number | null>(null);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [openTodoId, setOpenTodoId] = useState<number | null>(null);
  const [commPersonFilter, setCommPersonFilter] = useState<number | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const project = useLiveQuery(
    () => getProject(projectId),
    [projectId]
  );
  const todos = useLiveQuery(
    () => listProjectTodos(projectId),
    [projectId]
  );
  const communications = useLiveQuery(
    () => listProjectCommunications(projectId),
    [projectId]
  );
  const persons = useLiveQuery(() => listProjectPersons(), []);
  const milestones = useLiveQuery(
    () => listProjectMilestones(projectId),
    [projectId]
  );

  if (!project) return null;

  const personMap = Object.fromEntries((persons ?? []).map((p) => [p.id!, p.name]));
  const pc = getProjectColor(project.color);
  const sortedMilestones = [...(milestones ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const commPersonIds = [...new Set((communications ?? []).map((c) => c.personId).filter(Boolean) as number[])];
  const commFilterPersons = (persons ?? []).filter((p) => commPersonIds.includes(p.id!));
  const filteredComms = commPersonFilter != null
    ? (communications ?? []).filter((c) => c.personId === commPersonFilter)
    : (communications ?? []);

  async function handleMilestoneDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortedMilestones.findIndex((m) => m.id === active.id);
    const newIdx = sortedMilestones.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(sortedMilestones, oldIdx, newIdx);
    await reorderMilestones(reordered);
  }

  return (
    <div className="max-w-3xl">
      {/* Back + Header */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={onBack}
          className="mt-0.5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border flex-shrink-0 mt-1"
            style={{ backgroundColor: pc.bg, borderColor: pc.border }} />
          <div>
            {editingName ? (
              <input
                autoFocus
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={async () => {
                  const trimmed = editNameValue.trim();
                  if (trimmed) await updateProject(projectId, { title: trimmed });
                  setEditingName(false);
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const trimmed = editNameValue.trim();
                    if (trimmed) await updateProject(projectId, { title: trimmed });
                    setEditingName(false);
                  }
                  if (e.key === 'Escape') setEditingName(false);
                }}
                className="text-xl font-semibold text-gray-900 border border-primary-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                <button
                  onClick={() => { setEditNameValue(project.title); setEditingName(true); }}
                  className="p-1 text-gray-300 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Umbenennen"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            {project.deadline && (
              <p className="text-sm text-gray-400 mt-0.5">
                Deadline: {new Date(project.deadline).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Meilensteine ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Meilensteine</h3>
          <button onClick={() => setShowAddMilestone((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
            <Plus size={13} />
            Hinzufügen
          </button>
        </div>

        {showAddMilestone && (
          <AddMilestoneForm projectId={projectId} onDone={() => setShowAddMilestone(false)} />
        )}

        {sortedMilestones.length === 0 && !showAddMilestone && (
          <p className="text-sm text-gray-400">Noch keine Meilensteine.</p>
        )}

        {sortedMilestones.length > 0 && (
          <div className="border border-gray-100 rounded-xl px-4 mt-2">
            <DndContext sensors={sensors} onDragEnd={handleMilestoneDragEnd}>
              <SortableContext items={sortedMilestones.map((m) => m.id!)} strategy={verticalListSortingStrategy}>
                {sortedMilestones.map((m) => <MilestoneRow key={m.id} milestone={m} />)}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </section>

      {/* ── To-Dos ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To-Dos</h3>
          <button onClick={() => setShowAddTodo((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
            <Plus size={13} />
            Hinzufügen
          </button>
        </div>

        {showAddTodo && (
          <AddTodoInlineForm projectId={projectId} onDone={() => setShowAddTodo(false)} />
        )}

        {todos?.length === 0 && !showAddTodo && (
          <p className="text-sm text-gray-400">Keine To-Dos für dieses Projekt.</p>
        )}

        {(todos?.length ?? 0) > 0 && (
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-400 text-xs">Titel</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-400 text-xs">Status</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-400 text-xs">Deadline</th>
                <th className="py-2 w-6" />
              </tr>
            </thead>
            <tbody>
              {todos?.map((todo) => (
                <tr
                  key={todo.id}
                  onClick={() => setOpenTodoId(todo.id!)}
                  className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 group"
                >
                  <td className="py-2 pr-4 text-gray-900">{todo.title}</td>
                  <td className="py-2 pr-4">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CLASS[todo.status])}>
                      {STATUS_LABEL[todo.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">
                    {todo.deadline ? new Date(todo.deadline).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm('Todo löschen?')) deleteProjectTodo(todo.id!); }}
                      className="p-1 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {openTodoId != null && (
        <TodoDetailModal todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
      )}

      {/* ── Kommunikation ── */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kommunikation</h3>
        <AddCommunicationForm projectId={projectId} />
        {commFilterPersons.length > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <select
              value={commPersonFilter ?? ''}
              onChange={(e) => setCommPersonFilter(e.target.value ? Number(e.target.value) : null)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Alle Kontakte</option>
              {commFilterPersons.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3">
          {filteredComms.length === 0 && <p className="text-sm text-gray-400">Noch keine Einträge.</p>}
          {filteredComms.map((comm) => (
            <div key={comm.id} className="border border-gray-100 rounded-xl p-3 group">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className={clsx('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                  comm.type === 'In' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600')}>
                  {comm.type === 'In' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                  {comm.type === 'In' ? 'Eingehend' : 'Ausgehend'}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {comm.medium === 'Mail' ? <Mail size={11} /> : <Phone size={11} />}
                  {comm.medium === 'Mail' ? 'E-Mail' : 'Telefon'}
                </span>
                {comm.personId && personMap[comm.personId] && (
                  <span className="text-xs text-gray-500">{personMap[comm.personId]}</span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(comm.timestamp).toLocaleString('de-DE', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => setEditCommId(editCommId === comm.id ? null : comm.id!)}
                  className="p-1 text-gray-300 hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Bearbeiten"
                >
                  <Pencil size={12} />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comm.content}</p>
              {editCommId === comm.id && (
                <CommEditPanel commId={comm.id!} onClose={() => setEditCommId(null)} />
              )}
              {editCommId !== comm.id && (
                <div className="mt-2">
                  {comm.generatedTodoId ? (
                    <span className="text-xs text-green-600">✓ ToDo angelegt</span>
                  ) : (
                    <button
                      onClick={() => setGenerateForCommId(generateForCommId === comm.id ? null : comm.id!)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      + ToDo anlegen
                    </button>
                  )}
                </div>
              )}
              {generateForCommId === comm.id && editCommId !== comm.id && (
                <GenerateTodoForm
                  projectId={projectId}
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
