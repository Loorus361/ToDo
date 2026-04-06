import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, ChevronDown, ChevronUp, Phone, Mail, StickyNote } from 'lucide-react';
import { clsx } from 'clsx';
import {
  createPerson,
  deletePerson,
  getPerson,
  listPersonsByName,
  type Person,
  updatePerson,
} from '../data/contacts';
import { PERSON_GROUPS, GROUP_STYLES, sortPersonGroups } from '../lib/personGroups';

// ─── Gruppen-Badge ────────────────────────────────────────────────────────────
function GroupBadge({ group }: { group: string }) {
  const style = GROUP_STYLES[group] ?? { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {group}
    </span>
  );
}

// ─── Gruppen-Auswahl ──────────────────────────────────────────────────────────
function GroupPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (groups: string[]) => void;
}) {
  function toggle(g: string) {
    onChange(
      selected.includes(g)
        ? sortPersonGroups(selected.filter((x) => x !== g))
        : sortPersonGroups([...selected, g])
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {PERSON_GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => toggle(g)}
          className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-full border transition-colors',
            selected.includes(g) ? '' : 'opacity-60 hover:opacity-100'
          )}
          style={
            selected.includes(g)
              ? {
                  backgroundColor: GROUP_STYLES[g]?.bg,
                  color: GROUP_STYLES[g]?.text,
                  borderColor: GROUP_STYLES[g]?.border,
                }
              : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
          }
        >
          {g}
        </button>
      ))}
    </div>
  );
}

// ─── Kontakt-Zeile ────────────────────────────────────────────────────────────
function PersonRow({ personId }: { personId: number }) {
  const person = useLiveQuery(() => getPerson(personId), [personId]);
  const [expanded, setExpanded] = useState(false);

  if (!person) return null;

  async function update(field: Partial<Person>) {
    await updatePerson(personId, field);
  }

  async function handleDelete() {
    if (!confirm('Kontakt löschen?')) return;
    await deletePerson(personId);
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Header-Zeile */}
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer group"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{person.name}</span>
          {sortPersonGroups(person.groups ?? []).map((g) => <GroupBadge key={g} group={g} />)}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {person.phone && <Phone size={12} className="text-gray-300" />}
          {person.email && <Mail size={12} className="text-gray-300" />}
          {person.notes && <StickyNote size={12} className="text-gray-300" />}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="p-1 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
        </div>
      </div>

      {/* Detailbereich */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-3 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Name</label>
              <input
                type="text"
                defaultValue={person.name}
                onBlur={(e) => e.target.value.trim() && update({ name: e.target.value.trim() })}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Telefon</label>
              <input
                type="tel"
                defaultValue={person.phone ?? ''}
                onBlur={(e) => update({ phone: e.target.value.trim() || undefined })}
                placeholder="+49 …"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">E-Mail</label>
              <input
                type="email"
                defaultValue={person.email ?? ''}
                onBlur={(e) => update({ email: e.target.value.trim() || undefined })}
                placeholder="name@domain.de"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Gruppen</label>
            <GroupPicker
              selected={person.groups ?? []}
              onChange={(groups) => update({ groups })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">Notiz</label>
            <textarea
              defaultValue={person.notes ?? ''}
              onBlur={(e) => update({ notes: e.target.value.trim() || undefined })}
              rows={2}
              placeholder="Interne Notizen…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function ContactsView() {
  const persons = useLiveQuery(() => listPersonsByName(), []);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [filterGroups, setFilterGroups] = useState<string[]>([]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createPerson(name.trim());
    setName('');
    setCreating(false);
  }

  function toggleFilterGroup(g: string) {
    setFilterGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  const filtered = (persons ?? []).filter((p) => {
    if (filterGroups.length === 0) return true;
    return filterGroups.some((g) => p.groups?.includes(g));
  });

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Kontakte</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus size={16} />
          Neuer Kontakt
        </button>
      </div>

      {/* Create-Form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="mb-5 flex gap-2 p-4 border border-gray-200 rounded-xl bg-gray-50"
        >
          <input
            autoFocus
            type="text"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
          >
            Erstellen
          </button>
          <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600">✕</button>
        </form>
      )}

      {/* Gruppen-Filter */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Filter nach Gruppe</p>
        <div className="flex flex-wrap gap-1.5">
          {PERSON_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => toggleFilterGroup(g)}
              className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full border transition-all',
                filterGroups.includes(g) ? 'ring-2 ring-offset-1 ring-primary-400' : 'opacity-50 hover:opacity-80'
              )}
              style={
                filterGroups.includes(g)
                  ? { backgroundColor: GROUP_STYLES[g]?.bg, color: GROUP_STYLES[g]?.text, borderColor: GROUP_STYLES[g]?.border }
                  : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              {g}
            </button>
          ))}
          {filterGroups.length > 0 && (
            <button onClick={() => setFilterGroups([])} className="text-xs text-gray-400 hover:text-gray-600 px-2">
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          {filterGroups.length > 0 ? 'Keine Kontakte in dieser Gruppe.' : 'Noch keine Kontakte vorhanden.'}
        </p>
      )}
      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {filtered.map((p) => <PersonRow key={p.id} personId={p.id!} />)}
      </div>
    </div>
  );
}
