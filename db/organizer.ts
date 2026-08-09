// Serverseitige, eigentümergefilterte Datenoperationen für Aufgaben und Planung
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { OrganizerSnapshot, ProjectStatus, TodoStatus } from '../src/features/organizer/types';
import { getDb } from './index';
import { milestones, projects, projectTags, tags, todos, todoTags } from './schema';

export class OrganizerDataError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const TODO_STATUSES = new Set<TodoStatus>(['open', 'doing', 'waiting', 'backlog', 'done']);
const PROJECT_STATUSES = new Set<ProjectStatus>(['active', 'completed', 'archived']);

function cleanRequired(value: unknown, label: string, max = 240): string {
  const result = typeof value === 'string' ? value.trim() : '';
  if (!result) throw new OrganizerDataError(`${label} darf nicht leer sein.`);
  return result.slice(0, max);
}

function cleanOptional(value: unknown, max = 4000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanNullableDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new OrganizerDataError('Das Datum ist ungültig.');
  }
  return value;
}

function cleanNullableTime(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new OrganizerDataError('Die Uhrzeit ist ungültig.');
  }
  return value;
}

function cleanTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))];
}

async function requireOwnedProject(ownerId: string, projectId: string) {
  const db = await getDb();
  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))).limit(1);
  if (!project) throw new OrganizerDataError('Das Projekt wurde nicht gefunden.', 404);
}

async function requireOwnedTodo(ownerId: string, todoId: string) {
  const db = await getDb();
  const [todo] = await db.select({ id: todos.id }).from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.ownerId, ownerId))).limit(1);
  if (!todo) throw new OrganizerDataError('Die Aufgabe wurde nicht gefunden.', 404);
}

async function requireOwnedMilestone(ownerId: string, milestoneId: string) {
  const db = await getDb();
  const [milestone] = await db.select({ id: milestones.id }).from(milestones)
    .where(and(eq(milestones.id, milestoneId), eq(milestones.ownerId, ownerId))).limit(1);
  if (!milestone) throw new OrganizerDataError('Der Meilenstein wurde nicht gefunden.', 404);
}

async function validateOwnedTags(ownerId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;
  const db = await getDb();
  const owned = await db.select({ id: tags.id }).from(tags)
    .where(and(eq(tags.ownerId, ownerId), inArray(tags.id, tagIds)));
  if (owned.length !== tagIds.length) throw new OrganizerDataError('Mindestens ein Tag wurde nicht gefunden.', 404);
}

async function replaceTodoTags(ownerId: string, todoId: string, tagIds: string[]): Promise<void> {
  await validateOwnedTags(ownerId, tagIds);
  const db = await getDb();
  await db.delete(todoTags).where(and(eq(todoTags.ownerId, ownerId), eq(todoTags.todoId, todoId)));
  if (tagIds.length > 0) await db.insert(todoTags).values(tagIds.map((tagId) => ({ ownerId, todoId, tagId })));
}

async function replaceProjectTags(ownerId: string, projectId: string, tagIds: string[]): Promise<void> {
  await validateOwnedTags(ownerId, tagIds);
  const db = await getDb();
  await db.delete(projectTags).where(and(eq(projectTags.ownerId, ownerId), eq(projectTags.projectId, projectId)));
  if (tagIds.length > 0) await db.insert(projectTags).values(tagIds.map((tagId) => ({ ownerId, projectId, tagId })));
}

export async function getOrganizerSnapshot(
  ownerId: string,
  user: { displayName: string; email: string },
): Promise<OrganizerSnapshot> {
  const db = await getDb();
  const [todoRows, projectRows, milestoneRows, tagRows, todoTagRows, projectTagRows] = await Promise.all([
    db.select().from(todos).where(eq(todos.ownerId, ownerId)).orderBy(asc(todos.dueDate), desc(todos.createdAt)),
    db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(asc(projects.dueDate), desc(projects.createdAt)),
    db.select().from(milestones).where(eq(milestones.ownerId, ownerId)).orderBy(asc(milestones.sortOrder), asc(milestones.createdAt)),
    db.select().from(tags).where(eq(tags.ownerId, ownerId)).orderBy(asc(tags.name)),
    db.select().from(todoTags).where(eq(todoTags.ownerId, ownerId)),
    db.select().from(projectTags).where(eq(projectTags.ownerId, ownerId)),
  ]);

  const todoTagMap = new Map<string, string[]>();
  for (const link of todoTagRows) todoTagMap.set(link.todoId, [...(todoTagMap.get(link.todoId) ?? []), link.tagId]);
  const projectTagMap = new Map<string, string[]>();
  for (const link of projectTagRows) projectTagMap.set(link.projectId, [...(projectTagMap.get(link.projectId) ?? []), link.tagId]);

  return {
    user,
    todos: todoRows.map((todo) => ({
      id: todo.id,
      title: todo.title,
      notes: todo.notes,
      status: todo.status,
      dueDate: todo.dueDate,
      dueTime: todo.dueTime,
      followUpDate: todo.followUpDate,
      projectId: todo.projectId,
      tagIds: todoTagMap.get(todo.id) ?? [],
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
      completedAt: todo.completedAt,
    })),
    projects: projectRows.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      dueDate: project.dueDate,
      tagIds: projectTagMap.get(project.id) ?? [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })),
    milestones: milestoneRows.map((milestone) => ({
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      notes: milestone.notes,
      dueDate: milestone.dueDate,
      done: milestone.done,
      sortOrder: milestone.sortOrder,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
      completedAt: milestone.completedAt,
    })),
    tags: tagRows.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
  };
}

export async function createTodo(ownerId: string, input: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const title = cleanRequired(input.title, 'Der Aufgabentitel');
  const projectId = typeof input.projectId === 'string' && input.projectId ? input.projectId : null;
  if (projectId) await requireOwnedProject(ownerId, projectId);
  await db.insert(todos).values({ id, ownerId, title, projectId });
  await replaceTodoTags(ownerId, id, cleanTagIds(input.tagIds));
}

export async function updateTodo(ownerId: string, todoId: string, input: Record<string, unknown>): Promise<void> {
  await requireOwnedTodo(ownerId, todoId);
  const db = await getDb();
  const patch: Partial<typeof todos.$inferInsert> = { updatedAt: new Date().toISOString() };
  if ('title' in input) patch.title = cleanRequired(input.title, 'Der Aufgabentitel');
  if ('notes' in input) patch.notes = cleanOptional(input.notes);
  if ('status' in input) {
    if (typeof input.status !== 'string' || !TODO_STATUSES.has(input.status as TodoStatus)) throw new OrganizerDataError('Der Aufgabenstatus ist ungültig.');
    patch.status = input.status as TodoStatus;
    patch.completedAt = input.status === 'done' ? new Date().toISOString() : null;
  }
  if ('dueDate' in input) patch.dueDate = cleanNullableDate(input.dueDate);
  if ('dueTime' in input) patch.dueTime = cleanNullableTime(input.dueTime);
  if ('followUpDate' in input) patch.followUpDate = cleanNullableDate(input.followUpDate);
  if ('projectId' in input) {
    const projectId = typeof input.projectId === 'string' && input.projectId ? input.projectId : null;
    if (projectId) await requireOwnedProject(ownerId, projectId);
    patch.projectId = projectId;
  }
  await db.update(todos).set(patch).where(and(eq(todos.id, todoId), eq(todos.ownerId, ownerId)));
  if ('tagIds' in input) await replaceTodoTags(ownerId, todoId, cleanTagIds(input.tagIds));
}

export async function deleteTodo(ownerId: string, todoId: string): Promise<void> {
  await requireOwnedTodo(ownerId, todoId);
  const db = await getDb();
  await db.delete(todos).where(and(eq(todos.id, todoId), eq(todos.ownerId, ownerId)));
}

export async function createProject(ownerId: string, input: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    ownerId,
    name: cleanRequired(input.name, 'Der Projektname'),
    description: cleanOptional(input.description),
    dueDate: cleanNullableDate(input.dueDate),
  });
  await replaceProjectTags(ownerId, id, cleanTagIds(input.tagIds));
}

export async function updateProject(ownerId: string, projectId: string, input: Record<string, unknown>): Promise<void> {
  await requireOwnedProject(ownerId, projectId);
  const db = await getDb();
  const patch: Partial<typeof projects.$inferInsert> = { updatedAt: new Date().toISOString() };
  if ('name' in input) patch.name = cleanRequired(input.name, 'Der Projektname');
  if ('description' in input) patch.description = cleanOptional(input.description);
  if ('status' in input) {
    if (typeof input.status !== 'string' || !PROJECT_STATUSES.has(input.status as ProjectStatus)) throw new OrganizerDataError('Der Projektstatus ist ungültig.');
    patch.status = input.status as ProjectStatus;
  }
  if ('dueDate' in input) patch.dueDate = cleanNullableDate(input.dueDate);
  await db.update(projects).set(patch).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  if ('tagIds' in input) await replaceProjectTags(ownerId, projectId, cleanTagIds(input.tagIds));
}

export async function deleteProject(ownerId: string, projectId: string): Promise<void> {
  await requireOwnedProject(ownerId, projectId);
  const db = await getDb();
  await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
}

export async function createMilestone(ownerId: string, input: Record<string, unknown>): Promise<void> {
  const projectId = cleanRequired(input.projectId, 'Das Projekt', 100);
  await requireOwnedProject(ownerId, projectId);
  const db = await getDb();
  const [last] = await db.select({ sortOrder: milestones.sortOrder }).from(milestones)
    .where(and(eq(milestones.ownerId, ownerId), eq(milestones.projectId, projectId)))
    .orderBy(desc(milestones.sortOrder)).limit(1);
  await db.insert(milestones).values({
    id: crypto.randomUUID(),
    ownerId,
    projectId,
    title: cleanRequired(input.title, 'Der Meilensteintitel'),
    notes: cleanOptional(input.notes),
    dueDate: cleanNullableDate(input.dueDate),
    sortOrder: (last?.sortOrder ?? -1) + 1,
  });
}

export async function updateMilestone(ownerId: string, milestoneId: string, input: Record<string, unknown>): Promise<void> {
  await requireOwnedMilestone(ownerId, milestoneId);
  const db = await getDb();
  const patch: Partial<typeof milestones.$inferInsert> = { updatedAt: new Date().toISOString() };
  if ('title' in input) patch.title = cleanRequired(input.title, 'Der Meilensteintitel');
  if ('notes' in input) patch.notes = cleanOptional(input.notes);
  if ('dueDate' in input) patch.dueDate = cleanNullableDate(input.dueDate);
  if ('done' in input) {
    patch.done = Boolean(input.done);
    patch.completedAt = patch.done ? new Date().toISOString() : null;
  }
  await db.update(milestones).set(patch).where(and(eq(milestones.id, milestoneId), eq(milestones.ownerId, ownerId)));
}

export async function deleteMilestone(ownerId: string, milestoneId: string): Promise<void> {
  await requireOwnedMilestone(ownerId, milestoneId);
  const db = await getDb();
  await db.delete(milestones).where(and(eq(milestones.id, milestoneId), eq(milestones.ownerId, ownerId)));
}

export async function createTag(ownerId: string, input: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  const name = cleanRequired(input.name, 'Der Tagname', 40);
  const normalizedName = name.toLocaleLowerCase('de-DE');
  const color = typeof input.color === 'string' && /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : '#2563eb';
  const [existing] = await db.select({ id: tags.id }).from(tags)
    .where(and(eq(tags.ownerId, ownerId), eq(tags.normalizedName, normalizedName))).limit(1);
  if (existing) return;
  await db.insert(tags).values({ id: crypto.randomUUID(), ownerId, name, normalizedName, color });
}

export async function deleteTag(ownerId: string, tagId: string): Promise<void> {
  const db = await getDb();
  const result = await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.ownerId, ownerId))).returning({ id: tags.id });
  if (result.length === 0) throw new OrganizerDataError('Der Tag wurde nicht gefunden.', 404);
}
