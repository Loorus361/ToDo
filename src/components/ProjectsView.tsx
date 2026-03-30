import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { db, deleteProjectCascade } from '../db/db';
import { useStore } from '../store/useStore';

export default function ProjectsView() {
  const { setSelectedProjectId } = useStore();
  const projects = useLiveQuery(() => db.projects.orderBy('title').toArray(), []);

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await db.projects.add({ title: title.trim(), deadline: deadline || undefined });
    setTitle('');
    setDeadline('');
    setCreating(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Projekt und alle zugehörigen Daten löschen?')) return;
    await deleteProjectCascade(id);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Projekte</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus size={16} />
          Neues Projekt
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Projekttitel *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            required
          />
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <span className="text-xs text-gray-400">Deadline (optional)</span>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
            >
              Erstellen
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {projects?.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Noch keine Projekte vorhanden.</p>
      )}

      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
        {projects?.map((project) => (
          <div key={project.id} className="flex items-center px-4 py-3 bg-white hover:bg-gray-50 group">
            <button
              onClick={() => setSelectedProjectId(project.id!)}
              className="flex-1 flex items-center gap-3 text-left min-w-0"
            >
              <span className="text-sm font-medium text-gray-900 truncate">{project.title}</span>
              {project.deadline && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(project.deadline).toLocaleDateString('de-DE')}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handleDelete(project.id!)}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Löschen"
              >
                <Trash2 size={14} />
              </button>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
