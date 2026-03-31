import { useLiveQuery } from 'dexie-react-hooks';
import type { DragEndEvent } from '@dnd-kit/core';
import { db, type Todo } from '../db/db';
import { useStore } from '../store/useStore';

export type KanbanStatus = 'backlog' | 'backlog-low' | 'doing' | 'done' | 'archived';

export interface TodoWithProject extends Todo {
  projectTitle?: string;
  projectColor?: string;
}

const ALL_STATUSES: KanbanStatus[] = ['backlog', 'backlog-low', 'doing', 'done', 'archived'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function useKanbanLogic() {
  const filterProjectId = useStore((s) => s.filterProjectId);

  const todos = useLiveQuery(() => db.todos.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);

  const todosWithProject: TodoWithProject[] = (todos ?? [])
    .filter((t) => {
      if (filterProjectId === null) return true;      // alle
      if (filterProjectId === 0) return !t.projectId; // kein Projekt
      return t.projectId === filterProjectId;
    })
    .map((todo) => {
      const proj = projects?.find((p) => p.id === todo.projectId);
      return { ...todo, projectTitle: proj?.title, projectColor: proj?.color };
    });

  const columns: Record<KanbanStatus, TodoWithProject[]> = {
    backlog: todosWithProject.filter((t) => t.status === 'backlog'),
    'backlog-low': todosWithProject.filter((t) => t.status === 'backlog-low'),
    doing: todosWithProject.filter((t) => t.status === 'doing'),
    done: todosWithProject.filter((t) => t.status === 'done'),
    archived: todosWithProject.filter((t) => t.status === 'archived'),
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const todoId = active.id as number;
    const newStatus = over.id as KanbanStatus;

    if (!ALL_STATUSES.includes(newStatus)) return;

    const todo = todos?.find((t) => t.id === todoId);
    if (!todo || todo.status === newStatus) return;

    await db.todos.update(todoId, { status: newStatus });

    if (newStatus === 'done') {
      const today = getToday();
      const dependents = await db.todos.where('startAfterId').equals(todoId).toArray();
      for (const dep of dependents) {
        await db.todos.update(dep.id!, { startDate: today });
      }
    }
  }

  return { columns, handleDragEnd, projects: projects ?? [] };
}
