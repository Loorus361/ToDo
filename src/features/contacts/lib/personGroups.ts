export const PERSON_GROUPS = ['ZR', 'ZRA', 'SR', 'SRA', 'VR', 'VRA', 'GJPA-Prüfer'] as const;
export type PersonGroup = (typeof PERSON_GROUPS)[number];

interface GroupStyle { bg: string; text: string; border: string }

const PERSON_GROUP_ORDER = new Map(PERSON_GROUPS.map((group, index) => [group, index]));
const PERSON_GROUP_SET = new Set<string>(PERSON_GROUPS);

// Contacts aus der DB liefern groups als string[].
// Der Guard stellt sicher, dass wir nur bekannte PersonGroup-Werte
// für den typisierten Map-Zugriff verwenden.
function isPersonGroup(group: string): group is PersonGroup {
  return PERSON_GROUP_SET.has(group);
}

export function sortPersonGroups(groups: string[]) {
  return [...groups].sort((a, b) => {
    const indexA = isPersonGroup(a) ? (PERSON_GROUP_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const indexB = isPersonGroup(b) ? (PERSON_GROUP_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    return indexA - indexB || a.localeCompare(b);
  });
}

export const GROUP_STYLES: Record<string, GroupStyle> = {
  ZR:           { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  ZRA:          { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  SR:           { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  SRA:          { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  VR:           { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  VRA:          { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'GJPA-Prüfer':{ bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
};
