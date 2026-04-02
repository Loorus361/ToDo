import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, Check, Archive, Eye, EyeOff, Trash2, Star, RefreshCw } from 'lucide-react';
import { useKanbanLogic, type KanbanStatus, type TodoWithProject } from '../hooks/useKanbanLogic';
import { TodoDetailModal } from './TodoDetailModal';
import { useStore } from '../store/useStore';
import { useSettings } from '../hooks/useSettings';
import { db, autoScheduleTodayTodos } from '../db/db';
import { getProjectColor } from '../utils/projectColors';
import { getDeadlineStatus, deadlineTextClass } from '../utils/deadlineColors';

const COLUMN_LABELS: Record<KanbanStatus, string> = {
  today:    'Heute zur Bearbeitung',
  backlog:  'Backlog',
  doing:    'In Arbeit',
  done:     'Erledigt',
  archived: 'Archiviert',
};

const COLUMN_ACCENT: Record<KanbanStatus, string> = {
  today:    'bg-orange-400',
  backlog:  'bg-gray-400',
  doing:    'bg-yellow-400',
  done:     'bg-green-500',
  archived: 'bg-gray-200',
};

const ACTIVE_COLUMNS: KanbanStatus[] = ['backlog', 'today', 'doing', 'done'];

// ─── Add-Todo-Formular ────────────────────────────────────────────────────────
function AddTodoForm({ projects, defaultStatus, onClose }: {
  projects: { id?: number; title: string }[];
  defaultStatus: 'backlog' | 'doing';
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [deadline, setDeadline] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await db.todos.add({
      title: title.trim(),
      status: defaultStatus,
      projectId: projectId ? Number(projectId) : undefined,
      deadline: deadline || undefined,
    });
    setTitle('');
    setProjectId('');
    setDeadline('');
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
      <input autoFocus type="text" placeholder="Neues To-Do *" value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" required
      />
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300">
        <option value="">Kein Projekt</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
      <div className="flex items-center gap-1.5">
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">Deadline (optional)</span>
      </div>
      <button type="submit" className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors flex-shrink-0">
        Erstellen
      </button>
      <button type="button" onClick={onClose} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-sm flex-shrink-0">✕</button>
    </form>
  );
}

// ─── Todo-Karte ───────────────────────────────────────────────────────────────
function TodoCard({
  todo,
  isDragging = false,
  onOpen,
  redDays,
  yellowDays,
}: {
  todo: TodoWithProject;
  isDragging?: boolean;
  onOpen?: () => void;
  redDays: number;
  yellowDays: number;
}) {
  const pc = getProjectColor(todo.projectColor);
  const dlStatus = getDeadlineStatus(todo.deadline, redDays, yellowDays);
  const dlClass = deadlineTextClass(dlStatus);

  async function handleDone(e: React.MouseEvent) {
    e.stopPropagation();
    await db.todos.update(todo.id!, { status: 'done' });
  }
  async function handleArchive(e: React.MouseEvent) {
    e.stopPropagation();
    await db.todos.update(todo.id!, { status: 'archived' });
  }
  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Todo löschen?')) return;
    await db.todos.delete(todo.id!);
  }

  return (
    <div
      onClick={onOpen}
      className={clsx(
        'bg-white border border-gray-200 rounded-lg p-3 shadow-sm select-none group',
        isDragging && 'opacity-50',
        onOpen && 'cursor-pointer hover:border-primary-200 hover:shadow-md transition-all'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {todo.prio && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
          <p className="text-sm font-medium text-gray-900 leading-snug min-w-0">{todo.title}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {todo.status !== 'done' && (
            <button onClick={handleDone} className="p-1 rounded text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors" title="Erledigt">
              <Check size={13} />
            </button>
          )}
          {todo.status !== 'archived' && (
            <button onClick={handleArchive} className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Archivieren">
              <Archive size={13} />
            </button>
          )}
          <button onClick={handleDelete} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Löschen">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {todo.projectTitle && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full border"
            style={{ backgroundColor: pc.bg, borderColor: pc.border, color: pc.text }}>
            {todo.projectTitle}
          </span>
        )}
        {todo.deadline && (
          <span className={clsx('text-xs', dlClass)}>
            {new Date(todo.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
        {todo.description && (
          <span className="text-xs text-gray-300 italic truncate max-w-[100px]" title={todo.description}>
            {todo.description.slice(0, 25)}{todo.description.length > 25 ? '…' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Draggable Card ───────────────────────────────────────────────────────────
function DraggableTodoCard({ todo, onOpen, redDays, yellowDays }: {
  todo: TodoWithProject; onOpen: () => void; redDays: number; yellowDays: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: todo.id! });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <TodoCard todo={todo} isDragging={isDragging} onOpen={isDragging ? undefined : onOpen} redDays={redDays} yellowDays={yellowDays} />
    </div>
  );
}

// ─── Spalte ───────────────────────────────────────────────────────────────────
function KanbanColumn({ status, todos, onOpenTodo, redDays, yellowDays }: {
  status: KanbanStatus; todos: TodoWithProject[]; onOpenTodo: (id: number) => void;
  redDays: number; yellowDays: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const isToday = status === 'today';
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', COLUMN_ACCENT[status])} />
        <h3 className="text-sm font-semibold text-gray-700 truncate">{COLUMN_LABELS[status]}</h3>
        <span className="ml-auto text-xs text-gray-400 font-medium flex-shrink-0">{todos.length}</span>
      </div>
      <div ref={setNodeRef}
        className={clsx('flex-1 flex flex-col gap-2 min-h-32 rounded-xl p-2 transition-colors',
          isOver ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50',
          isToday && !isOver && 'border border-dashed border-orange-200 bg-orange-50/30'
        )}>
        {todos.map((todo) => (
          <DraggableTodoCard key={todo.id} todo={todo} onOpen={() => onOpenTodo(todo.id!)} redDays={redDays} yellowDays={yellowDays} />
        ))}
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function KanbanBoard() {
  const { columns, handleDragEnd, projects } = useKanbanLogic();
  const { filterProjectId, setFilterProjectId, showArchived, setShowArchived } = useStore();
  const settings = useSettings();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [openTodoId, setOpenTodoId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeTodo = activeId != null ? Object.values(columns).flat().find((t) => t.id === activeId) : null;

  // Beim ersten Laden fällige Backlog-Todos automatisch in "Heute" einplanen
  useEffect(() => { autoScheduleTodayTodos(); }, []);

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as number); }
  function onDragEnd(event: Parameters<typeof handleDragEnd>[0]) { setActiveId(null); handleDragEnd(event); }

  async function handleRefresh() {
    await autoScheduleTodayTodos();
    setRefreshKey((k) => k + 1);
  }

  const visibleColumns: KanbanStatus[] = showArchived ? [...ACTIVE_COLUMNS, 'archived'] : ACTIVE_COLUMNS;

  return (
    <div className="flex flex-col h-full gap-4" key={refreshKey}>
      {/* Board-Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
          <Plus size={15} />To-Do hinzufügen
        </button>

        <select
          value={filterProjectId ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setFilterProjectId(v === '' ? null : Number(v));
          }}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">Alle Projekte</option>
          <option value="0">Kein Projekt</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        <button onClick={() => setShowArchived(!showArchived)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors',
            showArchived ? 'border-gray-400 text-gray-700 bg-gray-100' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600')}>
          {showArchived ? <Eye size={14} /> : <EyeOff size={14} />}
          Archiviert
        </button>

        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors ml-auto"
          title="Heute-Spalte aktualisieren">
          <RefreshCw size={14} />
          Aktualisieren
        </button>
      </div>

      {showAddForm && (
        <AddTodoForm
          projects={projects}
          defaultStatus={settings.defaultTodoStatus ?? 'backlog'}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Kanban */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 min-h-0">
          {visibleColumns.map((status) => (
            <KanbanColumn key={status} status={status} todos={columns[status]} onOpenTodo={(id) => setOpenTodoId(id)}
              redDays={settings.deadlineRedDays} yellowDays={settings.deadlineYellowDays}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTodo && (
            <div className="rotate-1 shadow-lg">
              <TodoCard todo={activeTodo} redDays={settings.deadlineRedDays} yellowDays={settings.deadlineYellowDays} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openTodoId != null && (
        <TodoDetailModal todoId={openTodoId} onClose={() => setOpenTodoId(null)} />
      )}
    </div>
  );
}
