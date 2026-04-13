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

// Vergleichsfunktion für Array.sort(...):
// - negativer Rückgabewert => a soll vor b stehen
// - positiver Rückgabewert => b soll vor a stehen
// - 0 => beide sind für dieses Kriterium gleich und das nächste Kriterium entscheidet
function compareTodosByDeadline(a: TodoWithProject, b: TodoWithProject) {
  // 1. Primärsortierung: Todos mit Deadline sollen grundsätzlich vor Todos ohne Deadline stehen.
  // Wenn beide eine Deadline haben, entscheidet das frühere Datum.
  if (a.deadline && b.deadline) {
    // Die Deadlines liegen als ISO-Strings im Format YYYY-MM-DD vor.
    // Dadurch kann man sie direkt lexikografisch vergleichen:
    // "2026-04-10" kommt vor "2026-04-20".
    const deadlineCompare = a.deadline.localeCompare(b.deadline);

    // Ungleich bedeutet: die frühere Deadline kommt weiter nach oben im Board.
    if (deadlineCompare !== 0) return deadlineCompare;
  } else if (a.deadline) {
    // Nur a hat eine Deadline -> a soll vor b stehen.
    return -1;
  } else if (b.deadline) {
    // Nur b hat eine Deadline -> b soll vor a stehen.
    return 1;
  }

  // 2. Wenn die Deadline gleich ist oder beide gar keine Deadline haben:
  // priorisierte Todos (mit Stern) vor normalen Todos.
  if (a.prio !== b.prio) {
    // a.prio === true  -> a nach oben
    // a.prio === false -> b nach oben
    return a.prio ? -1 : 1;
  }

  // 3. Wenn auch die Priorität gleich ist:
  // alphabetisch nach Titel sortieren, damit die Liste für Menschen lesbar bleibt.
  const titleCompare = a.title.localeCompare(b.title, 'de-DE');

  // Wenn die Titel unterschiedlich sind, entscheidet die alphabetische Reihenfolge.
  if (titleCompare !== 0) return titleCompare;

  // 4. Letzter Fallback:
  // Wenn Deadline, Priorität und Titel identisch sind, nehmen wir die ID.
  // So bleibt die Reihenfolge stabil und eindeutig.
  return (a.id ?? 0) - (b.id ?? 0);
}

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

  // TODO: allColumns builds full arrays just to get .length — replace with a single reduce-based count map to avoid unnecessary allocations
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

  // Die feste Board-Sortierung wird zentral hier angewendet.
  // Vorteil: Jede Spalte benutzt automatisch dieselbe Logik,
  // ohne dass im UI pro Spalte separat sortiert werden muss.
  for (const status of DROPPABLE_STATUSES) {
    filteredColumns[status].sort(compareTodosByDeadline);
  }

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
