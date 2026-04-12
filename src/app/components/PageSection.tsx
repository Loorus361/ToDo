// Einfacher Layout-Wrapper mit optionalem Titel für Seitenabschnitte
import type { ReactNode } from 'react';

interface PageSectionProps {
  title?: string;
  fullHeight?: boolean;
  children: ReactNode;
}

export function PageSection({ title, fullHeight = false, children }: PageSectionProps) {
  return (
    <div className={fullHeight ? 'flex flex-col h-[calc(100vh-4rem)]' : undefined}>
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>}
      <div className={fullHeight ? 'flex-1 min-h-0' : undefined}>
        {children}
      </div>
    </div>
  );
}
