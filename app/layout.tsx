// HTML-Grundgerüst und Metadaten der veröffentlichten Ausbildungsverlauf-App
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ausbildungsverlauf.modest-guppy-7467.chatgpt.site'),
  title: 'Ausbildungsverlauf',
  description: 'Interaktiver Zeitstrahl für laufende Referendariatskampagnen',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    title: 'Ausbildungsverlauf',
    description: 'Referendariatskampagnen im zeitlichen Überblick',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ausbildungsverlauf',
    description: 'Referendariatskampagnen im zeitlichen Überblick',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
