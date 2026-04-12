// Feature-API für Projektvorlagen: CRUD und Anwenden einer Vorlage auf ein bestehendes Projekt
import { db, type ProjectTemplate } from '../../../shared/db/db';

export type { ProjectTemplate, TemplateTodoItem, TemplateMilestoneItem } from '../../../shared/db/db';

export function listTemplates() {
  return db.projectTemplates.orderBy('name').toArray();
}

export function getTemplate(id: number) {
  return db.projectTemplates.get(id);
}

export function createTemplate(input: Omit<ProjectTemplate, 'id'>) {
  return db.projectTemplates.add(input);
}

export function updateTemplate(id: number, partial: Partial<ProjectTemplate>) {
  return db.projectTemplates.update(id, partial);
}

export function deleteTemplate(id: number) {
  return db.projectTemplates.delete(id);
}

/** Legt für ein Projekt alle Todos und Meilensteine aus dem Template an. */
export async function applyTemplateToProject(projectId: number, templateId: number): Promise<void> {
  const template = await db.projectTemplates.get(templateId);
  if (!template) return;

  const todoInserts = (template.todos ?? []).map((t) =>
    db.todos.add({ title: t.title, status: t.status, description: t.description, prio: t.prio, projectId })
  );

  const milestoneInserts = (template.milestones ?? []).map((m, i) =>
    db.milestones.add({ title: m.title, notes: m.notes, done: false, projectId, order: i * 1000 })
  );

  await Promise.all([...todoInserts, ...milestoneInserts]);
}
