// Verwaltungsansicht für Projektvorlagen: Erstellen, Bearbeiten und Löschen von Vorlagen
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type ProjectTemplate,
  type TemplateTodoItem,
  type TemplateMilestoneItem,
} from '../data/templates';

// ─── Template-Formular ────────────────────────────────────────────────────────
function TemplateForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ProjectTemplate;
  onSave: (data: Omit<ProjectTemplate, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [todos, setTodos] = useState<TemplateTodoItem[]>(initial?.todos ?? []);
  const [milestones, setMilestones] = useState<TemplateMilestoneItem[]>(initial?.milestones ?? []);

  // Neues Todo-Template
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoStatus, setNewTodoStatus] = useState<'backlog' | 'doing' | 'today'>('backlog');

  // Neuer Meilenstein-Template
  const [newMsTitle, setNewMsTitle] = useState('');

  function addTodo() {
    if (!newTodoTitle.trim()) return;
    setTodos((prev) => [...prev, { title: newTodoTitle.trim(), status: newTodoStatus }]);
    setNewTodoTitle('');
  }

  function removeTodo(index: number) {
    setTodos((prev) => prev.filter((_, i) => i !== index));
  }

  function addMilestone() {
    if (!newMsTitle.trim()) return;
    setMilestones((prev) => [...prev, { title: newMsTitle.trim() }]);
    setNewMsTitle('');
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      todos,
      milestones,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          autoFocus
          type="text"
          placeholder="Template-Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <input
          type="text"
          placeholder="Beschreibung (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Todos */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">To-Dos</p>
        {todos.map((t, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
            <span className="flex-1 text-sm text-gray-800 truncate">{t.title}</span>
            <span className="text-xs text-gray-400">{t.status}</span>
            <button type="button" onClick={() => removeTodo(i)} className="text-gray-300 hover:text-red-500">
              <X size={13} />
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Titel *"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTodo())}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <select
            value={newTodoStatus}
            onChange={(e) => setNewTodoStatus(e.target.value as typeof newTodoStatus)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="backlog">Backlog</option>
            <option value="doing">In Arbeit</option>
            <option value="today">Heute</option>
          </select>
          <button type="button" onClick={addTodo}
            className="px-2 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Meilensteine */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Meilensteine</p>
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-100 last:border-0">
            <span className="flex-1 text-sm text-gray-800 truncate">{m.title}</span>
            <button type="button" onClick={() => removeMilestone(i)} className="text-gray-300 hover:text-red-500">
              <X size={13} />
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Meilenstein-Titel *"
            value={newMsTitle}
            onChange={(e) => setNewMsTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <button type="button" onClick={addMilestone}
            className="px-2 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit"
          className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
          Speichern
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ─── Template-Zeile ───────────────────────────────────────────────────────────
function TemplateRow({ template, onEdit }: { template: ProjectTemplate; onEdit: (t: ProjectTemplate) => void }) {
  const [expanded, setExpanded] = useState(false);

  async function handleDelete() {
    if (!confirm(`Template „${template.name}" löschen?`)) return;
    await deleteTemplate(template.id!);
  }

  const todoCount = template.todos?.length ?? 0;
  const msCount = template.milestones?.length ?? 0;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center px-4 py-3 bg-white hover:bg-gray-50 group">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <span className="text-sm font-medium text-gray-900 truncate">{template.name}</span>
          {template.description && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">{template.description}</span>
          )}
          <span className="text-xs text-gray-300 flex-shrink-0">
            {todoCount} To-Do{todoCount !== 1 ? 's' : ''} · {msCount} Meilenstein{msCount !== 1 ? 'e' : ''}
          </span>
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onClick={() => onEdit(template)} className="p-1.5 text-gray-300 hover:text-primary-500 transition-colors" title="Bearbeiten">
            <Pencil size={13} />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Löschen">
            <Trash2 size={13} />
          </button>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="ml-1 text-gray-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 bg-gray-50 flex gap-6 flex-wrap">
          {todoCount > 0 && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">To-Dos</p>
              {template.todos!.map((t, i) => (
                <p key={i} className="text-xs text-gray-600">• {t.title} <span className="text-gray-400">({t.status})</span></p>
              ))}
            </div>
          )}
          {msCount > 0 && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Meilensteine</p>
              {template.milestones!.map((m, i) => (
                <p key={i} className="text-xs text-gray-600">• {m.title}</p>
              ))}
            </div>
          )}
          {todoCount === 0 && msCount === 0 && (
            <p className="text-xs text-gray-400 italic">Keine Einträge definiert.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function TemplateManager() {
  const templates = useLiveQuery(() => listTemplates(), []);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);

  async function handleCreate(data: Omit<ProjectTemplate, 'id'>) {
    await createTemplate(data);
    setShowForm(false);
  }

  async function handleUpdate(data: Omit<ProjectTemplate, 'id'>) {
    if (!editingTemplate?.id) return;
    await updateTemplate(editingTemplate.id, data);
    setEditingTemplate(null);
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Projekt-Templates</h3>
        <button
          onClick={() => { setShowForm((v) => !v); setEditingTemplate(null); }}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus size={15} />
          Neues Template
        </button>
      </div>

      {showForm && !editingTemplate && (
        <div className="mb-4">
          <TemplateForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingTemplate && (
        <div className="mb-4">
          <TemplateForm
            initial={editingTemplate}
            onSave={handleUpdate}
            onCancel={() => setEditingTemplate(null)}
          />
        </div>
      )}

      {templates?.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 py-4 text-center">Noch keine Templates vorhanden.</p>
      )}

      {(templates?.length ?? 0) > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {templates?.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              onEdit={(tmpl) => { setEditingTemplate(tmpl); setShowForm(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
