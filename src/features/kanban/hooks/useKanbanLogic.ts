// Hook für Kanban-Board-Logik: reaktive Todo-Gruppen, Drag-and-Drop-Handler und Auto-Archivierung
import { useLiveQuery } from 'dexie-react-hooks';
import type { DragEndEvent } from '@dnd-kit/core';
import { listKanbanProjects, listKanbanTodos, moveTodoToStatus } from '../data/kanban';
import type { Todo } from '../../../shared/db/db';

export type KanbanStatus = 'today' | 'backlog' | 'doing' | 'done' | 'archived';

export interface TodoWithProject extends Todo {
  projectTitle?: string;
  projectColor?: string;
}

export interface KanbanColumnData {
  visibleTodos: TodoWithProject[];
  totalCount: number;
}

const DROPPABLE_STATUSES: KanbanStatus[] = ['today', 'backlog', 'doing', 'done', 'archived'];

export function useKanbanLogic(filterProjectId: number | null) {
  const todos = useLiveQuery(() => listKanbanTodos(), []);
  const projects = useLiveQuery(() => listKanbanProjects(), []);

  const todosWithProject: TodoWithProject[] = (todos ?? [])
    .map((todo) => {
      const proj = projects?.find((p) => p.id === todo.projectId);
      return { ...todo, projectTitle: proj?.title, projectColor: proj?.color };
    });

  const filtered: TodoWithProject[] = todosWithProject
    .filter((t) => {
      if (filterProjectId === null) return true;
      if (filterProjectId === 0) return !t.projectId;
      return t.projectId === filterProjectId;
    });

  const allColumns: Record<KanbanStatus, TodoWithProject[]> = {
    today:    todosWithProject.filter((t) => t.status === 'today'),
    backlog:  todosWithProject.filter((t) => t.status === 'backlog'),
    doing:    todosWithProject.filter((t) => t.status === 'doing'),
    done:     todosWithProject.filter((t) => t.status === 'done'),
    archived: todosWithProject.filter((t) => t.status === 'archived'),
  };

  const filteredColumns: Record<KanbanStatus, TodoWithProject[]> = {
    today:    filtered.filter((t) => t.status === 'today'),
    backlog:  filtered.filter((t) => t.status === 'backlog'),
    doing:    filtered.filter((t) => t.status === 'doing'),
    done:     filtered.filter((t) => t.status === 'done'),
    archived: filtered.filter((t) => t.status === 'archived'),
  };

  const columns: Record<KanbanStatus, KanbanColumnData> = {
    today: { visibleTodos: filteredColumns.today, totalCount: allColumns.today.length },
    backlog: { visibleTodos: filteredColumns.backlog, totalCount: allColumns.backlog.length },
    doing: { visibleTodos: filteredColumns.doing, totalCount: allColumns.doing.length },
    done: { visibleTodos: filteredColumns.done, totalCount: allColumns.done.length },
    archived: { visibleTodos: filteredColumns.archived, totalCount: allColumns.archived.length },
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
    await moveTodoToStatus(todoId, newStatus);
  }

  return { columns, handleDragEnd, projects: projects ?? [] };
}
