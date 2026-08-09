// Vollständige persönliche Aufgaben- und Planungsoberfläche nach dem freigegebenen Mockup
'use client';

import {
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FolderKanban,
  Hourglass,
  Inbox,
  ListTodo,
  MoreVertical,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  buildCalendarEntries,
  calculateProjectProgress,
  getNextMilestone,
  localDateKey,
  matchesTodoView,
  sortTodos,
  todoGroup,
} from '../lib/domain';
import type {
  CalendarEntry,
  MilestoneItem,
  OrganizerSnapshot,
  ProjectItem,
  ProjectStatus,
  TagItem,
  TodoItem,
  TodoStatus,
  TodoView,
} from '../types';
import { CalendarPanel } from './CalendarPanel';
import { TagPicker } from './TagPicker';

const STATUS_LABELS: Record<TodoStatus, string> = {
  open: 'Offen',
  doing: 'In Bearbeitung',
  waiting: 'Warten auf Rückmeldung',
  backlog: 'Backlog',
  done: 'Erledigt',
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Aktiv',
  completed: 'Abgeschlossen',
  archived: 'Archiviert',
};

const VIEW_LABELS: Record<TodoView, string> = {
  active: 'Offen',
  today: 'Heute',
  week: 'Diese Woche',
  open: 'Nur offen',
  doing: 'In Bearbeitung',
  waiting: 'Warten',
  backlog: 'Backlog',
  done: 'Erledigt',
};

const GROUP_LABELS = {
  overdue: 'Überfällig',
  today: 'Heute',
  week: 'Später diese Woche',
  later: 'Später',
  undated: 'Ohne Termin',
} as const;

type Mutation = (action: string, options?: { id?: string; input?: Record<string, unknown> }) => Promise<OrganizerSnapshot>;

interface OrganizerAppProps {
  initialSection: 'tasks' | 'planning';
  initialProjectId?: string;
}

function dateLabel(date: string | null, time?: string | null): string {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  return time ? `${value}, ${time}` : value;
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function tagStyle(tag: TagItem): React.CSSProperties {
  return { color: tag.color, backgroundColor: `${tag.color}14`, borderColor: `${tag.color}33` };
}

function TagChips({ tagIds, tags }: { tagIds: string[]; tags: TagItem[] }) {
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  return (
    <span className="flex flex-wrap gap-1.5">
      {tagIds.map((id) => tagMap.get(id)).filter((tag): tag is TagItem => Boolean(tag)).map((tag) => (
        <span key={tag.id} className="tag-chip" style={tagStyle(tag)}>{tag.name}</span>
      ))}
    </span>
  );
}

function Drawer({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-label={title} className={`h-full w-full overflow-y-auto bg-white shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Schließen"><X size={20} /></button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}

function Sidebar({
  section,
  view,
  onView,
  todos,
  projectFilter,
  onProjectFilter,
}: {
  section: 'tasks' | 'planning';
  view: TodoView;
  onView: (view: TodoView) => void;
  todos: TodoItem[];
  projectFilter: ProjectStatus;
  onProjectFilter: (status: ProjectStatus) => void;
}) {
  const count = (candidate: TodoView) => todos.filter((todo) => matchesTodoView(todo, candidate)).length;
  const taskItems: Array<{ view: TodoView; icon: React.ReactNode }> = [
    { view: 'active', icon: <Inbox size={19} /> },
    { view: 'today', icon: <CalendarDays size={19} /> },
    { view: 'week', icon: <CalendarDays size={19} /> },
    { view: 'doing', icon: <Clock3 size={19} /> },
    { view: 'waiting', icon: <Hourglass size={19} /> },
    { view: 'backlog', icon: <Archive size={19} /> },
    { view: 'done', icon: <CheckCircle2 size={19} /> },
  ];

  return (
    <aside className="hidden h-screen w-[276px] flex-none border-r border-slate-200 bg-white px-3 py-5 md:flex md:flex-col">
      <div className="mb-8 flex h-11 items-center gap-3 px-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-blue-600 text-blue-600"><Check size={25} strokeWidth={3} /></span>
        <span className="text-sm font-semibold text-slate-700">Meine Planung</span>
      </div>
      <nav className="space-y-1">
        <Link href="/" className={`sidebar-primary ${section === 'tasks' ? 'sidebar-primary-active' : ''}`}>
          <CheckCircle2 size={20} /> Aufgaben
        </Link>
        <Link href="/planung" className={`sidebar-primary ${section === 'planning' ? 'sidebar-primary-active' : ''}`}>
          <FolderKanban size={20} /> Planung
        </Link>
      </nav>
      <div className="my-5 border-t border-slate-200" />

      {section === 'tasks' ? (
        <div className="min-h-0 overflow-y-auto px-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Aufgaben</p>
          <div className="space-y-1">
            {taskItems.map((item) => (
              <button type="button" key={item.view} onClick={() => onView(item.view)} className={`sidebar-filter ${view === item.view ? 'sidebar-filter-active' : ''}`}>
                <span className="flex items-center gap-3">{item.icon}{VIEW_LABELS[item.view]}</span>
                <span className="count-badge">{count(item.view)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Projekte</p>
          {(['active', 'completed', 'archived'] as const).map((status) => (
            <button type="button" key={status} onClick={() => onProjectFilter(status)} className={`sidebar-filter ${projectFilter === status ? 'sidebar-filter-active' : ''}`}>
              <span className="flex items-center gap-3">{status === 'active' ? <FolderKanban size={19} /> : status === 'completed' ? <CheckCircle2 size={19} /> : <Archive size={19} />}{PROJECT_STATUS_LABELS[status]}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function TodoRow({ todo, tags, project, onOpen, onToggle }: {
  todo: TodoItem;
  tags: TagItem[];
  project?: ProjectItem;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const overdue = todo.dueDate && todo.dueDate < localDateKey() && todo.status !== 'done';
  return (
    <div className="todo-row">
      <button type="button" onClick={onToggle} className={`todo-check ${todo.status === 'done' ? 'todo-check-done' : ''}`} aria-label={todo.status === 'done' ? 'Aufgabe wieder öffnen' : 'Aufgabe erledigen'}>
        {todo.status === 'done' && <Check size={14} strokeWidth={3} />}
      </button>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-sm font-medium sm:text-[15px] ${todo.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{todo.title}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-2">
          <TagChips tagIds={todo.tagIds} tags={tags} />
          {project && <span className="project-chip"><FolderKanban size={11} />{project.name}</span>}
        </span>
      </button>
      {(todo.dueDate || todo.followUpDate) && (
        <span className={`hidden flex-none text-xs sm:block ${overdue ? 'font-medium text-red-600' : 'text-slate-500'}`}>
          {todo.dueDate ? dateLabel(todo.dueDate, todo.dueTime) : `Wieder ${dateLabel(todo.followUpDate)}`}
        </span>
      )}
      <button type="button" onClick={onOpen} className="icon-button flex-none" aria-label="Aufgabe bearbeiten"><MoreVertical size={18} /></button>
    </div>
  );
}

function TodoDetail({ todo, snapshot, mutate, onClose }: { todo: TodoItem; snapshot: OrganizerSnapshot; mutate: Mutation; onClose: () => void }) {
  const [showTags, setShowTags] = useState(false);

  async function update(input: Record<string, unknown>) {
    await mutate('todo.update', { id: todo.id, input });
  }

  return (
    <Drawer title="Aufgabe bearbeiten" onClose={onClose}>
      <div className="space-y-5">
        <label className="form-field">
          <span>Titel</span>
          <input key={`${todo.id}:${todo.updatedAt}:title`} defaultValue={todo.title} onBlur={(event) => event.target.value.trim() !== todo.title && update({ title: event.target.value })} className="form-input" />
        </label>
        <label className="form-field">
          <span>Status</span>
          <select value={todo.status} onChange={(event) => update({ status: event.target.value })} className="form-input">
            {(Object.keys(STATUS_LABELS) as TodoStatus[]).map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Projekt</span>
          <select value={todo.projectId ?? ''} onChange={(event) => update({ projectId: event.target.value || null })} className="form-input">
            <option value="">Kein Projekt</option>
            {snapshot.projects.filter((project) => project.status === 'active').map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-field">
            <span>Fällig am</span>
            <input type="date" value={todo.dueDate ?? ''} onChange={(event) => update({ dueDate: event.target.value || null })} className="form-input" />
          </label>
          <label className="form-field">
            <span>Uhrzeit</span>
            <input type="time" value={todo.dueTime ?? ''} onChange={(event) => update({ dueTime: event.target.value || null })} className="form-input" />
          </label>
        </div>
        <label className="form-field">
          <span>Wiedervorlage</span>
          <input type="date" value={todo.followUpDate ?? ''} onChange={(event) => update({ followUpDate: event.target.value || null })} className="form-input" />
          <small>Praktisch für Aufgaben im Status „Warten auf Rückmeldung“.</small>
        </label>
        <label className="form-field">
          <span>Notiz</span>
          <textarea key={`${todo.id}:${todo.updatedAt}:notes`} defaultValue={todo.notes} onBlur={(event) => event.target.value !== todo.notes && update({ notes: event.target.value })} rows={5} className="form-input resize-none" placeholder="Details, nächster Schritt oder Ansprechpartner …" />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="form-label">Tags</span>
            <button type="button" onClick={() => setShowTags((value) => !value)} className="text-sm font-medium text-blue-600">{showTags ? 'Schließen' : 'Bearbeiten'}</button>
          </div>
          <TagChips tagIds={todo.tagIds} tags={snapshot.tags} />
          {showTags && (
            <div className="mt-3">
              <TagPicker
                tags={snapshot.tags}
                selectedIds={todo.tagIds}
                onChange={(tagIds) => update({ tagIds })}
                onCreate={(name, color) => mutate('tag.create', { input: { name, color } }).then(() => undefined)}
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-5">
          <button type="button" onClick={async () => {
            if (!window.confirm('Diese Aufgabe wirklich löschen?')) return;
            await mutate('todo.delete', { id: todo.id });
            onClose();
          }} className="danger-button"><Trash2 size={16} /> Aufgabe löschen</button>
        </div>
      </div>
    </Drawer>
  );
}

function NewProjectDrawer({ snapshot, mutate, onClose }: { snapshot: OrganizerSnapshot; mutate: Mutation; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);

  return (
    <Drawer title="Neues Projekt" onClose={onClose}>
      <form className="space-y-5" onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        await mutate('project.create', { input: { name, description, dueDate: dueDate || null, tagIds } });
        onClose();
      }}>
        <label className="form-field"><span>Name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="form-input" required /></label>
        <label className="form-field"><span>Beschreibung</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="form-input resize-none" /></label>
        <label className="form-field"><span>Fälligkeit</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="form-input" /></label>
        <div><span className="form-label mb-2 block">Tags</span><TagPicker tags={snapshot.tags} selectedIds={tagIds} onChange={setTagIds} onCreate={(tagName, color) => mutate('tag.create', { input: { name: tagName, color } }).then(() => undefined)} /></div>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} className="secondary-button">Abbrechen</button>
          <button type="submit" className="primary-button">Projekt anlegen</button>
        </div>
      </form>
    </Drawer>
  );
}

function ProjectCard({ project, milestones, tasks, tags }: { project: ProjectItem; milestones: MilestoneItem[]; tasks: TodoItem[]; tags: TagItem[] }) {
  const progress = calculateProjectProgress(milestones);
  const nextMilestone = getNextMilestone(milestones);
  return (
    <Link href={`/planung/${project.id}`} className="project-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{project.name}</h3>
          {project.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>}
        </div>
        <MoreVertical size={18} className="flex-none text-slate-400" />
      </div>
      <div className="mt-3"><TagChips tagIds={project.tagIds} tags={tags} /></div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{progress.done} von {progress.total} Meilensteinen</span><span>{progress.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} /></div>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <span className="flex items-center gap-2"><CalendarDays size={14} />{project.dueDate ? dateLabel(project.dueDate) : 'Keine Fälligkeit'}</span>
        <span className="flex items-center gap-2"><ListTodo size={14} />{tasks.filter((task) => task.status !== 'done').length} offene Aufgaben</span>
      </div>
      {nextMilestone && <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><strong className="font-semibold">Als Nächstes:</strong> {nextMilestone.title}{nextMilestone.dueDate ? ` · ${dateLabel(nextMilestone.dueDate)}` : ''}</div>}
    </Link>
  );
}

function ProjectDetail({ project, snapshot, mutate, onOpenTodo }: { project: ProjectItem; snapshot: OrganizerSnapshot; mutate: Mutation; onOpenTodo: (todo: TodoItem) => void }) {
  const router = useRouter();
  const projectMilestones = snapshot.milestones.filter((milestone) => milestone.projectId === project.id);
  const projectTodos = sortTodos(snapshot.todos.filter((todo) => todo.projectId === project.id));
  const progress = calculateProjectProgress(projectMilestones);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const editingMilestone = projectMilestones.find((milestone) => milestone.id === editingMilestoneId) ?? null;

  async function update(input: Record<string, unknown>) {
    await mutate('project.update', { id: project.id, input });
  }

  return (
    <div>
      <Link href="/planung" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"><ChevronLeft size={17} /> Zur Projektübersicht</Link>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <input key={`${project.id}:${project.updatedAt}:name`} defaultValue={project.name} onBlur={(event) => event.target.value.trim() !== project.name && update({ name: event.target.value })} className="w-full border-0 bg-transparent p-0 text-2xl font-bold text-slate-950 outline-none" />
            <textarea key={`${project.id}:${project.updatedAt}:description`} defaultValue={project.description} onBlur={(event) => event.target.value !== project.description && update({ description: event.target.value })} rows={2} placeholder="Kurze Beschreibung …" className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-500 outline-none" />
          </div>
          <select value={project.status} onChange={(event) => update({ status: event.target.value })} className="form-input w-auto">
            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((status) => <option value={status} key={status}>{PROJECT_STATUS_LABELS[status]}</option>)}
          </select>
        </div>
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <label className="form-field"><span>Fälligkeit</span><input type="date" value={project.dueDate ?? ''} onChange={(event) => update({ dueDate: event.target.value || null })} className="form-input" /></label>
          <div>
            <div className="mb-2 flex items-center justify-between"><span className="form-label">Tags</span><button type="button" onClick={() => setShowTags((value) => !value)} className="text-sm font-medium text-blue-600">Bearbeiten</button></div>
            <TagChips tagIds={project.tagIds} tags={snapshot.tags} />
          </div>
        </div>
        {showTags && <div className="mt-4 rounded-xl border border-slate-200 p-4"><TagPicker tags={snapshot.tags} selectedIds={project.tagIds} onChange={(tagIds) => update({ tagIds })} onCreate={(name, color) => mutate('tag.create', { input: { name, color } }).then(() => undefined)} /></div>}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>{progress.done} von {progress.total} Meilensteinen erledigt</span><span>{progress.percent}%</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress.percent}%` }} /></div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Meilensteine</h2>
        <form className="mt-4 flex gap-2" onSubmit={async (event) => {
          event.preventDefault(); if (!milestoneTitle.trim()) return;
          await mutate('milestone.create', { input: { projectId: project.id, title: milestoneTitle } }); setMilestoneTitle('');
        }}>
          <input value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="Meilenstein hinzufügen" className="form-input min-w-0 flex-1" />
          <button type="submit" className="secondary-button"><Plus size={17} /><span className="hidden sm:inline">Hinzufügen</span></button>
        </form>
        <div className="mt-4 divide-y divide-slate-100">
          {projectMilestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3 py-3">
              <button type="button" onClick={() => mutate('milestone.update', { id: milestone.id, input: { done: !milestone.done } })} className={`todo-check ${milestone.done ? 'todo-check-done' : ''}`}>{milestone.done && <Check size={14} strokeWidth={3} />}</button>
              <input key={`${milestone.id}:${milestone.updatedAt}:title`} defaultValue={milestone.title} onBlur={(event) => event.target.value.trim() !== milestone.title && mutate('milestone.update', { id: milestone.id, input: { title: event.target.value } })} className={`min-w-0 flex-1 border-0 bg-transparent text-sm outline-none ${milestone.done ? 'text-slate-400 line-through' : 'text-slate-800'}`} />
              <input type="date" value={milestone.dueDate ?? ''} onChange={(event) => mutate('milestone.update', { id: milestone.id, input: { dueDate: event.target.value || null } })} className="hidden rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 sm:block" />
              <button type="button" onClick={() => setEditingMilestoneId(milestone.id)} className="icon-button" aria-label="Meilenstein bearbeiten"><MoreVertical size={15} /></button>
              <button type="button" onClick={() => window.confirm('Meilenstein löschen?') && mutate('milestone.delete', { id: milestone.id })} className="icon-button" aria-label="Meilenstein löschen"><Trash2 size={15} /></button>
            </div>
          ))}
          {projectMilestones.length === 0 && <p className="py-7 text-center text-sm text-slate-400">Noch keine Meilensteine angelegt.</p>}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Zugeordnete Aufgaben</h2>
        <form className="mt-4 flex gap-2" onSubmit={async (event) => {
          event.preventDefault(); if (!taskTitle.trim()) return;
          await mutate('todo.create', { input: { title: taskTitle, projectId: project.id } }); setTaskTitle('');
        }}>
          <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Aufgabe für dieses Projekt" className="form-input min-w-0 flex-1" />
          <button type="submit" className="secondary-button"><Plus size={17} /><span className="hidden sm:inline">Hinzufügen</span></button>
        </form>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          {projectTodos.map((todo) => <TodoRow key={todo.id} todo={todo} tags={snapshot.tags} project={project} onOpen={() => onOpenTodo(todo)} onToggle={() => mutate('todo.update', { id: todo.id, input: { status: todo.status === 'done' ? 'open' : 'done' } })} />)}
          {projectTodos.length === 0 && <p className="p-7 text-center text-sm text-slate-400">Noch keine Aufgaben zugeordnet.</p>}
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={async () => {
          if (!window.confirm('Projekt löschen? Zugeordnete Aufgaben bleiben erhalten.')) return;
          await mutate('project.delete', { id: project.id }); router.push('/planung');
        }} className="danger-button"><Trash2 size={16} /> Projekt löschen</button>
      </div>

      {editingMilestone && (
        <Drawer title="Meilenstein bearbeiten" onClose={() => setEditingMilestoneId(null)}>
          <div className="space-y-5">
            <label className="form-field"><span>Titel</span><input key={`${editingMilestone.id}:${editingMilestone.updatedAt}:title`} defaultValue={editingMilestone.title} onBlur={(event) => event.target.value.trim() !== editingMilestone.title && mutate('milestone.update', { id: editingMilestone.id, input: { title: event.target.value } })} className="form-input" /></label>
            <label className="form-field"><span>Zieldatum</span><input type="date" value={editingMilestone.dueDate ?? ''} onChange={(event) => mutate('milestone.update', { id: editingMilestone.id, input: { dueDate: event.target.value || null } })} className="form-input" /></label>
            <label className="form-field"><span>Notiz</span><textarea key={`${editingMilestone.id}:${editingMilestone.updatedAt}:notes`} defaultValue={editingMilestone.notes} onBlur={(event) => event.target.value !== editingMilestone.notes && mutate('milestone.update', { id: editingMilestone.id, input: { notes: event.target.value } })} rows={5} className="form-input resize-none" /></label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={editingMilestone.done} onChange={(event) => mutate('milestone.update', { id: editingMilestone.id, input: { done: event.target.checked } })} /> Erledigt</label>
            <div className="border-t border-slate-200 pt-5"><button type="button" onClick={async () => { if (!window.confirm('Meilenstein löschen?')) return; await mutate('milestone.delete', { id: editingMilestone.id }); setEditingMilestoneId(null); }} className="danger-button"><Trash2 size={16} /> Meilenstein löschen</button></div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default function OrganizerApp({ initialSection, initialProjectId }: OrganizerAppProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<OrganizerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<TodoView>('active');
  const [projectFilter, setProjectFilter] = useState<ProjectStatus>('active');
  const [query, setQuery] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [calendarDateFilter, setCalendarDateFilter] = useState<string | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/organizer', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as OrganizerSnapshot & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Daten konnten nicht geladen werden.');
        return payload;
      })
      .then((payload) => { if (!cancelled) setSnapshot(payload); })
      .catch((reason: Error) => { if (!cancelled) setError(reason.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const mutate: Mutation = async (action, options = {}) => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/organizer', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, id: options.id, input: options.input ?? {} }),
      });
      const payload = await response.json() as OrganizerSnapshot & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Die Änderung konnte nicht gespeichert werden.');
      setSnapshot(payload);
      return payload;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Die Änderung konnte nicht gespeichert werden.';
      setError(message); throw reason;
    } finally {
      setBusy(false);
    }
  };

  const selectedTodo = snapshot?.todos.find((todo) => todo.id === selectedTodoId) ?? null;
  const selectedProject = snapshot?.projects.find((project) => project.id === initialProjectId) ?? null;
  const calendarEntries = useMemo(() => snapshot ? buildCalendarEntries(snapshot.todos, snapshot.projects, snapshot.milestones, snapshot.tags) : [], [snapshot]);

  const visibleTodos = useMemo(() => {
    if (!snapshot) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');
    const projectMap = new Map(snapshot.projects.map((project) => [project.id, project]));
    const tagMap = new Map(snapshot.tags.map((tag) => [tag.id, tag]));
    return sortTodos(snapshot.todos.filter((todo) => {
      if (!matchesTodoView(todo, view)) return false;
      if (selectedTagId && !todo.tagIds.includes(selectedTagId)) return false;
      if (calendarDateFilter && todo.dueDate !== calendarDateFilter && todo.followUpDate !== calendarDateFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = [todo.title, todo.notes, todo.projectId ? projectMap.get(todo.projectId)?.name ?? '' : '', ...todo.tagIds.map((id) => tagMap.get(id)?.name ?? '')].join(' ').toLocaleLowerCase('de-DE');
      return haystack.includes(normalizedQuery);
    }));
  }, [snapshot, query, view, selectedTagId, calendarDateFilter]);

  const groupedTodos = useMemo(() => {
    const groups = new Map<keyof typeof GROUP_LABELS, TodoItem[]>();
    for (const todo of visibleTodos) {
      const group = todoGroup(todo);
      groups.set(group, [...(groups.get(group) ?? []), todo]);
    }
    return (['overdue', 'today', 'week', 'later', 'undated'] as const).map((group) => ({ group, todos: groups.get(group) ?? [] })).filter((item) => item.todos.length > 0);
  }, [visibleTodos]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Deine Planung wird geladen …</div>;
  if (!snapshot) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center"><h1 className="text-lg font-semibold text-slate-900">Anmeldung erforderlich</h1><p className="mt-2 text-sm text-slate-500">{error || 'Bitte öffne die private Site nach der Anmeldung mit ChatGPT.'}</p></div></div>;

  function openCalendarEntry(entry: CalendarEntry) {
    if (entry.kind === 'todo' || entry.kind === 'follow-up') setSelectedTodoId(entry.sourceId);
    else if (entry.projectId) router.push(`/planung/${entry.projectId}`);
    setShowCalendar(false);
  }

  const calendar = <CalendarPanel entries={calendarEntries} selectedDate={selectedDate} onSelectDate={(date) => { setSelectedDate(date); if (initialSection === 'tasks') setCalendarDateFilter(date); }} onOpenEntry={openCalendarEntry} />;
  const planningProjects = snapshot.projects.filter((project) => project.status === projectFilter).filter((project) => !query.trim() || `${project.name} ${project.description}`.toLocaleLowerCase('de-DE').includes(query.trim().toLocaleLowerCase('de-DE')));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar section={initialSection} view={view} onView={(next) => { setView(next); setCalendarDateFilter(null); }} todos={snapshot.todos} projectFilter={projectFilter} onProjectFilter={setProjectFilter} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <header className="flex min-h-[94px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-blue-600 md:hidden" size={23} />
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{initialSection === 'tasks' ? 'Aufgaben' : 'Planung'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="search-field hidden sm:flex"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen" /></label>
            <button type="button" onClick={() => setShowCalendar(true)} className="icon-button xl:hidden" aria-label="Kalender öffnen"><CalendarDays size={20} /></button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700" title={snapshot.user.displayName}>{initials(snapshot.user.displayName)}</span>
          </div>
        </header>
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <label className="search-field flex !w-full"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen" /></label>
        </div>

        {error && <div className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7 lg:mx-10"><span>{error}</span><button type="button" onClick={() => setError('')}><X size={17} /></button></div>}
        {busy && <div className="fixed right-4 top-4 z-[70] rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">Wird gespeichert …</div>}

        <main className="p-4 sm:p-7 lg:p-10">
          <div className="mx-auto grid max-w-[1320px] gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="min-w-0">
              {initialSection === 'tasks' ? (
                <>
                  <form className="quick-add" onSubmit={async (event) => {
                    event.preventDefault(); if (!quickTitle.trim()) return;
                    await mutate('todo.create', { input: { title: quickTitle } }); setQuickTitle('');
                  }}>
                    <input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Was ist zu tun?" aria-label="Neue Aufgabe" />
                    <button type="submit" className="primary-button"><Plus size={18} className="sm:hidden" /><span className="hidden sm:inline">Hinzufügen</span></button>
                  </form>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {selectedTagId && snapshot.tags.find((tag) => tag.id === selectedTagId) && (() => {
                      const tag = snapshot.tags.find((item) => item.id === selectedTagId)!;
                      return <button type="button" onClick={() => setSelectedTagId(null)} className="filter-chip" style={tagStyle(tag)}>{tag.name}<X size={14} /></button>;
                    })()}
                    {calendarDateFilter && <button type="button" onClick={() => setCalendarDateFilter(null)} className="filter-chip"><CalendarDays size={14} />{dateLabel(calendarDateFilter)}<X size={14} /></button>}
                    <div className="group relative">
                      <button type="button" className="secondary-button"><Tag size={16} /> Tag</button>
                      <div className="tag-filter-popover">
                        {snapshot.tags.map((tag) => <button type="button" key={tag.id} onClick={() => setSelectedTagId(tag.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />{tag.name}</button>)}
                        {snapshot.tags.length === 0 && <span className="block px-3 py-2 text-sm text-slate-400">Tags legst du in einer Aufgabe an.</span>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 space-y-7">
                    {groupedTodos.map(({ group, todos }) => (
                      <section key={group}>
                        <h2 className={`mb-3 text-lg font-semibold ${group === 'overdue' ? 'text-red-700' : 'text-slate-900'}`}>{GROUP_LABELS[group]}</h2>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          {todos.map((todo) => <TodoRow key={todo.id} todo={todo} tags={snapshot.tags} project={snapshot.projects.find((project) => project.id === todo.projectId)} onOpen={() => setSelectedTodoId(todo.id)} onToggle={() => mutate('todo.update', { id: todo.id, input: { status: todo.status === 'done' ? 'open' : 'done' } })} />)}
                        </div>
                      </section>
                    ))}
                    {visibleTodos.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><CheckCircle2 className="mx-auto text-slate-300" size={32} /><p className="mt-3 text-sm font-medium text-slate-500">Hier ist gerade nichts zu tun.</p></div>}
                  </div>
                </>
              ) : initialProjectId ? (
                selectedProject ? <ProjectDetail project={selectedProject} snapshot={snapshot} mutate={mutate} onOpenTodo={(todo) => setSelectedTodoId(todo.id)} /> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="text-slate-500">Das Projekt wurde nicht gefunden.</p><Link href="/planung" className="mt-3 inline-block text-sm font-medium text-blue-600">Zur Übersicht</Link></div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">Projekte, Meilensteine und zugeordnete Aufgaben im Blick behalten.</p>
                    <button type="button" onClick={() => setShowNewProject(true)} className="primary-button"><Plus size={18} /> Neues Projekt</button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {planningProjects.map((project) => <ProjectCard key={project.id} project={project} milestones={snapshot.milestones.filter((milestone) => milestone.projectId === project.id)} tasks={snapshot.todos.filter((todo) => todo.projectId === project.id)} tags={snapshot.tags} />)}
                  </div>
                  {planningProjects.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><FolderKanban className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm font-medium text-slate-500">Noch keine Projekte in dieser Ansicht.</p><button type="button" onClick={() => setShowNewProject(true)} className="mt-3 text-sm font-semibold text-blue-600">Erstes Projekt anlegen</button></div>}
                </>
              )}
            </div>
            <div className="hidden xl:block">{calendar}</div>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white p-2 md:hidden">
        <Link href="/" className={`mobile-nav ${initialSection === 'tasks' ? 'mobile-nav-active' : ''}`}><CheckCircle2 size={20} />Aufgaben</Link>
        <Link href="/planung" className={`mobile-nav ${initialSection === 'planning' ? 'mobile-nav-active' : ''}`}><FolderKanban size={20} />Planung</Link>
      </nav>

      {showCalendar && <Drawer title="Kalender" onClose={() => setShowCalendar(false)}>{calendar}</Drawer>}
      {selectedTodo && <TodoDetail key={`${selectedTodo.id}:${selectedTodo.updatedAt}`} todo={selectedTodo} snapshot={snapshot} mutate={mutate} onClose={() => setSelectedTodoId(null)} />}
      {showNewProject && <NewProjectDrawer snapshot={snapshot} mutate={mutate} onClose={() => setShowNewProject(false)} />}
    </div>
  );
}
