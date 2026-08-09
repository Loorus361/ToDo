// Authentifizierte JSON-Schnittstelle für alle Aufgaben- und Planungsaktionen
import {
  createMilestone,
  createProject,
  createTag,
  createTodo,
  deleteMilestone,
  deleteProject,
  deleteTag,
  deleteTodo,
  getOrganizerSnapshot,
  OrganizerDataError,
  updateMilestone,
  updateProject,
  updateTodo,
} from '../../../db/organizer';
import { readRequestIdentity } from '../../../src/features/organizer/server/requestIdentity';

function errorResponse(error: unknown): Response {
  if (error instanceof OrganizerDataError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
  if (message.includes('no such table')) {
    return Response.json({ error: 'Die Datenbank wird noch vorbereitet. Bitte lade die Seite gleich erneut.' }, { status: 503 });
  }
  return Response.json({ error: 'Die Änderung konnte nicht gespeichert werden.' }, { status: 500 });
}

export async function GET(request: Request) {
  const user = readRequestIdentity(request, process.env.NODE_ENV === 'development');
  if (!user) return Response.json({ error: 'Bitte melde dich mit ChatGPT an.' }, { status: 401 });
  try {
    return Response.json(await getOrganizerSnapshot(user.ownerId, user));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const user = readRequestIdentity(request, process.env.NODE_ENV === 'development');
  if (!user) return Response.json({ error: 'Bitte melde dich mit ChatGPT an.' }, { status: 401 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = typeof payload.action === 'string' ? payload.action : '';
    const id = typeof payload.id === 'string' ? payload.id : '';
    const input = payload.input && typeof payload.input === 'object' ? payload.input as Record<string, unknown> : {};

    switch (action) {
      case 'todo.create': await createTodo(user.ownerId, input); break;
      case 'todo.update': await updateTodo(user.ownerId, id, input); break;
      case 'todo.delete': await deleteTodo(user.ownerId, id); break;
      case 'project.create': await createProject(user.ownerId, input); break;
      case 'project.update': await updateProject(user.ownerId, id, input); break;
      case 'project.delete': await deleteProject(user.ownerId, id); break;
      case 'milestone.create': await createMilestone(user.ownerId, input); break;
      case 'milestone.update': await updateMilestone(user.ownerId, id, input); break;
      case 'milestone.delete': await deleteMilestone(user.ownerId, id); break;
      case 'tag.create': await createTag(user.ownerId, input); break;
      case 'tag.delete': await deleteTag(user.ownerId, id); break;
      default: throw new OrganizerDataError('Die Aktion ist unbekannt.');
    }

    return Response.json(await getOrganizerSnapshot(user.ownerId, user));
  } catch (error) {
    return errorResponse(error);
  }
}
