export const PERSON_GROUPS = ['ZR', 'ZRA', 'SR', 'SRA', 'VR', 'VRA', 'GJPA-Prüfer'] as const;
export type PersonGroup = (typeof PERSON_GROUPS)[number];

interface GroupStyle { bg: string; text: string; border: string }

export const GROUP_STYLES: Record<string, GroupStyle> = {
  ZR:           { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  ZRA:          { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  SR:           { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  SRA:          { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  VR:           { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  VRA:          { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'GJPA-Prüfer':{ bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
};
