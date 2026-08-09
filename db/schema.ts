// Drizzle-Schema für persönliche Aufgaben, Projekte, Meilensteine und Tags in D1
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: text('status', { enum: ['active', 'completed', 'archived'] }).notNull().default('active'),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_projects_owner_status').on(table.ownerId, table.status),
  index('idx_projects_owner_due').on(table.ownerId, table.dueDate),
]);

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  status: text('status', { enum: ['open', 'doing', 'waiting', 'backlog', 'done'] }).notNull().default('open'),
  dueDate: text('due_date'),
  dueTime: text('due_time'),
  followUpDate: text('follow_up_date'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_todos_owner_status').on(table.ownerId, table.status),
  index('idx_todos_owner_due').on(table.ownerId, table.dueDate),
  index('idx_todos_owner_follow_up').on(table.ownerId, table.followUpDate),
  index('idx_todos_owner_project').on(table.ownerId, table.projectId),
]);

export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  dueDate: text('due_date'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_milestones_owner_project').on(table.ownerId, table.projectId),
  index('idx_milestones_owner_due').on(table.ownerId, table.dueDate),
]);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  color: text('color').notNull().default('#2563eb'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex('idx_tags_owner_normalized_name').on(table.ownerId, table.normalizedName),
]);

export const todoTags = sqliteTable('todo_tags', {
  ownerId: text('owner_id').notNull(),
  todoId: text('todo_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.todoId, table.tagId] }),
  index('idx_todo_tags_owner').on(table.ownerId),
]);

export const projectTags = sqliteTable('project_tags', {
  ownerId: text('owner_id').notNull(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.tagId] }),
  index('idx_project_tags_owner').on(table.ownerId),
]);
