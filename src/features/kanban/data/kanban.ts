import { autoScheduleTodayTodos, db, type Todo } from '../../../shared/db/db';

export function listKanbanTodos() {
  return db.todos.toArray();
}

export function listKanbanProjects() {
  return db.projects.toArray();
}

export function moveTodoToStatus(todoId: number, status: Todo['status']) {
  return db.todos.update(todoId, { status });
}

export function scheduleTodayTodos() {
  return autoScheduleTodayTodos();
}
