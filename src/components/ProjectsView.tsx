import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, ChevronRight, Calendar } from 'lucide-react';
import { db, deleteProjectCascade } from '../db/db';
import { useStore } from '../store/useStore';
import { PROJECT_COLORS, getProjectColor } from '../utils/projectColors';

// ─── Farb-Picker ──────────────────────────────────────────────────────────────
function ColorPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          title={c.label}
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c.bg,
            borderColor: (value ?? 'none') === c.id ? c.border : 'transparent',
            outline: (value ?? 'none') === c.id ? `2px solid ${c.border}` : 'none',
            outlineOffset: '1px',
          }}
        />
      ))}
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function ProjectsView() {
  const { setSelectedProjectId } = useStore();
  const projects = useLiveQuery(() => db.projects.orderBy('title').toArray(), []);

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState<string>('none');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await db.projects.add({
      title: title.trim(),
      deadline: deadline || undefined,
      color: color === 'none' ? undefined : color,
    });
    setTitle('');
    setDeadline('');
    setColor('none');
    setCreating(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Projekt und alle zugehörigen Daten löschen?')) return;
    await deleteProjectCascade(id);
  }

  async function handleColorChange(id: number, colorId: string) {
    await db.projects.update(id, { color: colorId === 'none' ? undefined : colorId });
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

      {/* Neues-Projekt-Form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-3"
        >
          <input
            autoFocus
            type="text"
            placeholder="Projekttitel *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            required
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-gray-400" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
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

      <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
        {projects?.map((project) => {
          const pc = getProjectColor(project.color);
          return (
            <div key={project.id} className="flex items-center px-4 py-3 bg-white hover:bg-gray-50 group">
              {/* Farb-Indikator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mr-3 border"
                style={{ backgroundColor: pc.bg, borderColor: pc.border }}
              />

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

              <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Farb-Picker inline */}
                <ColorPicker
                  value={project.color ?? 'none'}
                  onChange={(id) => handleColorChange(project.id!, id)}
                />
                <button
                  onClick={() => handleDelete(project.id!)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="Löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <ChevronRight size={15} className="text-gray-300 flex-shrink-0 ml-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
