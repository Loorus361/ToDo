import { db, type Todo } from '../../../shared/db/db';

export type { Todo } from '../../../shared/db/db';

export function getTodo(todoId: number) {
  return db.todos.get(todoId);
}

export function listTodoProjects() {
  return db.projects.orderBy('title').toArray();
}

export function getTodoCommunication(commId: number) {
  return db.communications.get(commId);
}

export function getTodoPerson(personId: number) {
  return db.persons.get(personId);
}

export function createTodo(input: Omit<Todo, 'id'>) {
  return db.todos.add(input);
}

export function updateTodo(todoId: number, field: Partial<Todo>) {
  return db.todos.update(todoId, field);
}

export function deleteTodo(todoId: number) {
  return db.todos.delete(todoId);
}
