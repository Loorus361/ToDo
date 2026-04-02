import { useLiveQuery } from 'dexie-react-hooks';
import type { DragEndEvent } from '@dnd-kit/core';
import { db, type Todo } from '../db/db';
import { useStore } from '../store/useStore';

export type KanbanStatus = 'today' | 'backlog' | 'doing' | 'done' | 'archived';

export interface TodoWithProject extends Todo {
  projectTitle?: string;
  projectColor?: string;
}

const DROPPABLE_STATUSES: KanbanStatus[] = ['today', 'backlog', 'doing', 'done', 'archived'];

export function useKanbanLogic() {
  const filterProjectId = useStore((s) => s.filterProjectId);

  const todos = useLiveQuery(() => db.todos.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);

  const filtered: TodoWithProject[] = (todos ?? [])
    .filter((t) => {
      if (filterProjectId === null) return true;
      if (filterProjectId === 0) return !t.projectId;
      return t.projectId === filterProjectId;
    })
    .map((todo) => {
      const proj = projects?.find((p) => p.id === todo.projectId);
      return { ...todo, projectTitle: proj?.title, projectColor: proj?.color };
    });

  // Spalten direkt aus gespeichertem Status – keine virtuelle Berechnung mehr
  const columns: Record<KanbanStatus, TodoWithProject[]> = {
    today:    filtered.filter((t) => t.status === 'today'),
    backlog:  filtered.filter((t) => t.status === 'backlog'),
    doing:    filtered.filter((t) => t.status === 'doing'),
    done:     filtered.filter((t) => t.status === 'done'),
    archived: filtered.filter((t) => t.status === 'archived'),
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const todoId = active.id as number;
    const newStatus = over.id as KanbanStatus;

    if (!DROPPABLE_STATUSES.includes(newStatus)) return;

    const todo = todos?.find((t) => t.id === todoId);
    if (!todo) return;
    if (todo.status === newStatus) return;

    // lastAutoScheduledDate bleibt erhalten – verhindert, dass ein in backlog
    // zurückgeschobenes Todo noch heute erneut nach "Heute" wandert
    await db.todos.update(todoId, { status: newStatus });
  }

  return { columns, handleDragEnd, projects: projects ?? [] };
}
