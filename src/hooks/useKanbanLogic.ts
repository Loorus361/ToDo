import { useLiveQuery } from 'dexie-react-hooks';
import type { DragEndEvent } from '@dnd-kit/core';
import { db, type Todo } from '../db/db';

export type KanbanStatus = 'backlog' | 'doing' | 'done';

export interface TodoWithProject extends Todo {
  projectTitle?: string;
}

const COLUMNS: KanbanStatus[] = ['backlog', 'doing', 'done'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function useKanbanLogic() {
  const todos = useLiveQuery(() => db.todos.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);

  const todosWithProject: TodoWithProject[] = (todos ?? []).map((todo) => ({
    ...todo,
    projectTitle: projects?.find((p) => p.id === todo.projectId)?.title,
  }));

  const columns: Record<KanbanStatus, TodoWithProject[]> = {
    backlog: todosWithProject.filter((t) => t.status === 'backlog'),
    doing: todosWithProject.filter((t) => t.status === 'doing'),
    done: todosWithProject.filter((t) => t.status === 'done'),
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const todoId = active.id as number;
    const newStatus = over.id as KanbanStatus;

    if (!COLUMNS.includes(newStatus)) return;

    const todo = todos?.find((t) => t.id === todoId);
    if (!todo || todo.status === newStatus) return;

    await db.todos.update(todoId, { status: newStatus });

    if (newStatus === 'done') {
      const today = getToday();
      const dependents = await db.todos
        .where('startAfterId')
        .equals(todoId)
        .toArray();

      for (const dep of dependents) {
        await db.todos.update(dep.id!, { startDate: today });
      }
    }
  }

  return { columns, handleDragEnd };
}
