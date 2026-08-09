// Wiederverwendbare Tag-Auswahl mit Inline-Anlage für Aufgaben und Projekte
'use client';

import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { TagItem } from '../types';

const TAG_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#16a34a', '#d97706', '#0891b2', '#64748b'];

interface TagPickerProps {
  tags: TagItem[];
  selectedIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreate: (name: string, color: string) => Promise<void>;
}

export function TagPicker({ tags, selectedIds, onChange, onCreate }: TagPickerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  function toggle(tagId: string) {
    onChange(selectedIds.includes(tagId) ? selectedIds.filter((id) => id !== tagId) : [...selectedIds, tagId]);
  }

  async function createTag() {
    if (!name.trim()) return;
    await onCreate(name.trim(), color);
    setName('');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <button
              type="button"
              key={tag.id}
              onClick={() => toggle(tag.id)}
              className={`tag-option ${selected ? 'tag-option-selected' : ''}`}
              style={{ '--tag-color': tag.color } as React.CSSProperties}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
              {selected ? <Check size={13} /> : <Plus size={13} />}
            </button>
          );
        })}
        {tags.length === 0 && <span className="text-sm text-slate-400">Noch keine Tags vorhanden.</span>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Neuer Tag</span>
          {name && <button type="button" onClick={() => setName('')} aria-label="Eingabe leeren"><X size={14} /></button>}
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), createTag())}
            placeholder="Tagname"
            className="form-input min-w-0 flex-1"
          />
          <button type="button" onClick={createTag} className="secondary-button">Anlegen</button>
        </div>
        <div className="mt-2 flex gap-1.5">
          {TAG_COLORS.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => setColor(option)}
              className={`h-6 w-6 rounded-full border-2 ${color === option ? 'border-slate-700' : 'border-white'}`}
              style={{ backgroundColor: option }}
              aria-label={`Farbe ${option}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
