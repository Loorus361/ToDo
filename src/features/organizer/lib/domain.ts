// Reine Datums-, Filter- und Fortschrittslogik für Aufgaben und Projekte
import type {
  CalendarEntry,
  MilestoneItem,
  ProjectItem,
  TagItem,
  TodoItem,
  TodoView,
} from '../types';

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function weekBounds(date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay() || 7;
  start.setDate(start.getDate() - weekday + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: localDateKey(start), end: localDateKey(end) };
}

export function todoSignalDate(todo: TodoItem): string | null {
  const dates = [todo.dueDate, todo.followUpDate].filter((value): value is string => Boolean(value));
  if (dates.length === 0) return null;
  return dates.sort()[0];
}

export function matchesTodoView(todo: TodoItem, view: TodoView, now = new Date()): boolean {
  const today = localDateKey(now);
  const signalDate = todoSignalDate(todo);

  if (view === 'active') return todo.status !== 'done' && todo.status !== 'backlog';
  if (view === 'today') return todo.status !== 'done' && signalDate !== null && signalDate <= today;
  if (view === 'week') {
    if (todo.status === 'done' || signalDate === null) return false;
    const { start, end } = weekBounds(now);
    return signalDate >= start && signalDate <= end;
  }
  return todo.status === view;
}

export function sortTodos(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((left, right) => {
    const leftDate = todoSignalDate(left) ?? '9999-12-31';
    const rightDate = todoSignalDate(right) ?? '9999-12-31';
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    const leftTime = left.dueTime ?? '99:99';
    const rightTime = right.dueTime ?? '99:99';
    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function todoGroup(todo: TodoItem, now = new Date()): 'overdue' | 'today' | 'week' | 'later' | 'undated' {
  const date = todoSignalDate(todo);
  if (!date) return 'undated';
  const today = localDateKey(now);
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  const { end } = weekBounds(now);
  if (date <= end) return 'week';
  return 'later';
}

export function calculateProjectProgress(milestones: MilestoneItem[]): { done: number; total: number; percent: number } {
  const total = milestones.length;
  const done = milestones.filter((milestone) => milestone.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function getNextMilestone(milestones: MilestoneItem[]): MilestoneItem | null {
  const open = milestones.filter((milestone) => !milestone.done);
  if (open.length === 0) return null;
  return [...open].sort((left, right) => {
    const leftDate = left.dueDate ?? '9999-12-31';
    const rightDate = right.dueDate ?? '9999-12-31';
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return left.sortOrder - right.sortOrder;
  })[0];
}

export function buildCalendarEntries(
  todos: TodoItem[],
  projects: ProjectItem[],
  milestones: MilestoneItem[],
  tags: TagItem[],
): CalendarEntry[] {
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const fallbackColor = '#64748b';
  const colorFor = (tagIds: string[]) => tagIds.map((id) => tagMap.get(id)?.color).find(Boolean) ?? fallbackColor;

  const todoEntries = todos.flatMap<CalendarEntry>((todo) => {
    if (todo.status === 'done') return [];
    const color = colorFor(todo.tagIds);
    const entries: CalendarEntry[] = [];
    if (todo.dueDate) {
      entries.push({ id: `todo:${todo.id}:${todo.dueDate}`, sourceId: todo.id, kind: 'todo', date: todo.dueDate, title: todo.title, color, projectId: todo.projectId ?? undefined });
    }
    if (todo.followUpDate && todo.followUpDate !== todo.dueDate) {
      entries.push({ id: `follow-up:${todo.id}:${todo.followUpDate}`, sourceId: todo.id, kind: 'follow-up', date: todo.followUpDate, title: `Wiedervorlage: ${todo.title}`, color, projectId: todo.projectId ?? undefined });
    }
    return entries;
  });

  const projectEntries = projects.flatMap<CalendarEntry>((project) => {
    if (!project.dueDate || project.status !== 'active') return [];
    return [{ id: `project:${project.id}:${project.dueDate}`, sourceId: project.id, kind: 'project', date: project.dueDate, title: project.name, color: colorFor(project.tagIds), projectId: project.id }];
  });

  const activeProjectIds = new Set(projects.filter((project) => project.status === 'active').map((project) => project.id));
  const milestoneEntries = milestones.flatMap<CalendarEntry>((milestone) => {
    if (!milestone.dueDate || milestone.done || !activeProjectIds.has(milestone.projectId)) return [];
    return [{ id: `milestone:${milestone.id}:${milestone.dueDate}`, sourceId: milestone.id, kind: 'milestone', date: milestone.dueDate, title: milestone.title, color: '#7c3aed', projectId: milestone.projectId }];
  });

  return [...todoEntries, ...projectEntries, ...milestoneEntries].sort((left, right) => left.date.localeCompare(right.date));
}
