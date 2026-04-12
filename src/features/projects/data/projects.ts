// Feature-API für Projekte: CRUD inklusive Cascade-Delete von abhängigen Todos und Meilensteinen
import {
  db,
  deleteProjectCascade,
  type Communication,
  type Milestone,
  type Project,
  type Todo,
} from '../../../shared/db/db';

export type { Communication, Milestone, Project } from '../../../shared/db/db';

export function listProjectsByTitle() {
  return db.projects.orderBy('title').toArray();
}

export function createProject(input: Omit<Project, 'id'>) {
  return db.projects.add(input);
}

export function updateProject(projectId: number, field: Partial<Project>) {
  return db.projects.update(projectId, field);
}

export function removeProject(projectId: number) {
  return deleteProjectCascade(projectId);
}

export function getProject(projectId: number) {
  return db.projects.get(projectId);
}

export function listProjectTodos(projectId: number) {
  return db.todos.where('projectId').equals(projectId).toArray();
}

export function listProjectCommunications(projectId: number) {
  return db.communications.where('projectId').equals(projectId).reverse().sortBy('timestamp');
}

export function listProjectMilestones(projectId: number) {
  return db.milestones.where('projectId').equals(projectId).toArray();
}

export function listProjectPersons() {
  return db.persons.toArray();
}

export function listProjectPersonsByName() {
  return db.persons.orderBy('name').toArray();
}

export function createQuickPerson(name: string) {
  return db.persons.add({ name });
}

export function createProjectTodo(input: Omit<Todo, 'id'>) {
  return db.todos.add(input);
}

export function deleteProjectTodo(todoId: number) {
  return db.todos.delete(todoId);
}

export function createMilestone(projectId: number, title: string, notes?: string) {
  return db.milestones.add({ title, notes, done: false, projectId, order: Date.now() });
}

export function updateMilestone(milestoneId: number, field: Partial<Milestone>) {
  return db.milestones.update(milestoneId, field);
}

export function deleteMilestone(milestoneId: number) {
  return db.milestones.delete(milestoneId);
}

export async function reorderMilestones(milestones: Milestone[]) {
  await Promise.all(milestones.map((milestone, index) =>
    db.milestones.update(milestone.id!, { order: index * 1000 })
  ));
}

export function getCommunication(commId: number) {
  return db.communications.get(commId);
}

export function createProjectCommunication(input: Omit<Communication, 'id'>) {
  return db.communications.add(input);
}

export function updateCommunication(commId: number, partial: Partial<Communication>) {
  return db.communications.update(commId, partial);
}

export function deleteCommunication(commId: number) {
  return db.communications.delete(commId);
}

export async function createTodoFromCommunication(
  projectId: number,
  commId: number,
  title: string,
  deadline?: string,
) {
  const todoId = await db.todos.add({
    title,
    status: 'backlog',
    deadline,
    projectId,
    commId,
  });
  await db.communications.update(commId, { generatedTodoId: todoId as number });
  return todoId;
}
