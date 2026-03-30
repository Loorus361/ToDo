import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, User } from 'lucide-react';
import { db } from '../db/db';

export default function ContactsView() {
  const persons = useLiveQuery(() => db.persons.orderBy('name').toArray(), []);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await db.persons.add({ name: name.trim() });
    setName('');
    setCreating(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Kontakt löschen?')) return;
    await db.persons.delete(id);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Kontakte</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus size={16} />
          Neuer Kontakt
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <input
            autoFocus
            type="text"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 transition-colors"
          >
            Erstellen
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </form>
      )}

      {persons?.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Noch keine Kontakte vorhanden.</p>
      )}

      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
        {persons?.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 group"
          >
            <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-primary-400" />
            </div>
            <span className="flex-1 text-sm text-gray-900">{person.name}</span>
            <button
              onClick={() => handleDelete(person.id!)}
              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Löschen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
