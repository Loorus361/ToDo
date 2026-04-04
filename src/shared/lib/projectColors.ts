export interface ProjectColor {
  id: string;
  label: string;
  bg: string;
  border: string;
  text: string;
}

export const PROJECT_COLORS: ProjectColor[] = [
  { id: 'none',   label: 'Standard', bg: '#f9fafb', border: '#e5e7eb', text: '#374151' },
  { id: 'blue',   label: 'Blau',     bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  { id: 'green',  label: 'Grün',     bg: '#dcfce7', border: '#86efac', text: '#166534' },
  { id: 'yellow', label: 'Gelb',     bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
  { id: 'red',    label: 'Rot',      bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  { id: 'purple', label: 'Lila',     bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' },
  { id: 'pink',   label: 'Rosa',     bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { id: 'orange', label: 'Orange',   bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  { id: 'teal',   label: 'Türkis',   bg: '#ccfbf1', border: '#5eead4', text: '#115e59' },
];

export function getProjectColor(colorId: string | undefined): ProjectColor {
  return PROJECT_COLORS.find((c) => c.id === colorId) ?? PROJECT_COLORS[0];
}
