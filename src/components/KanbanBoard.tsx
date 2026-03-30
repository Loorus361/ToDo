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
import { useState } from 'react';
import { clsx } from 'clsx';
import { useKanbanLogic, type KanbanStatus, type TodoWithProject } from '../hooks/useKanbanLogic';

const COLUMN_LABELS: Record<KanbanStatus, string> = {
  backlog: 'Backlog',
  doing: 'In Arbeit',
  done: 'Erledigt',
};

const COLUMN_ACCENT: Record<KanbanStatus, string> = {
  backlog: 'bg-gray-400',
  doing: 'bg-primary-500',
  done: 'bg-green-500',
};

// ─── Todo Card ────────────────────────────────────────────────────────────────

function TodoCard({
  todo,
  isDragging = false,
}: {
  todo: TodoWithProject;
  isDragging?: boolean;
}) {
  return (
    <div
      className={clsx(
        'bg-white border border-gray-200 rounded-lg p-3 shadow-sm select-none',
        isDragging && 'opacity-50'
      )}
    >
      <p className="text-sm font-medium text-gray-900 leading-snug">{todo.title}</p>

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {todo.projectTitle && (
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
            {todo.projectTitle}
          </span>
        )}
        {todo.deadline && (
          <span className="text-xs text-gray-400">
            {new Date(todo.deadline).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Draggable Card ───────────────────────────────────────────────────────────

function DraggableTodoCard({ todo }: { todo: TodoWithProject }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: todo.id!,
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <TodoCard todo={todo} isDragging={isDragging} />
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  todos,
}: {
  status: KanbanStatus;
  todos: TodoWithProject[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', COLUMN_ACCENT[status])} />
        <h3 className="text-sm font-semibold text-gray-700">{COLUMN_LABELS[status]}</h3>
        <span className="ml-auto text-xs text-gray-400 font-medium">{todos.length}</span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 flex flex-col gap-2 min-h-32 rounded-xl p-2 transition-colors',
          isOver ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
        )}
      >
        {todos.map((todo) => (
          <DraggableTodoCard key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const { columns, handleDragEnd } = useKanbanLogic();
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTodo = activeId != null
    ? Object.values(columns).flat().find((t) => t.id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number);
  }

  function onDragEnd(event: Parameters<typeof handleDragEnd>[0]) {
    setActiveId(null);
    handleDragEnd(event);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full">
        {(['backlog', 'doing', 'done'] as KanbanStatus[]).map((status) => (
          <KanbanColumn key={status} status={status} todos={columns[status]} />
        ))}
      </div>

      <DragOverlay>
        {activeTodo && (
          <div className="rotate-1 shadow-lg">
            <TodoCard todo={activeTodo} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
