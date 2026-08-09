// HTML-Grundgerüst und Metadaten der privaten Aufgaben- und Planungs-App
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: 'Meine Aufgaben und Planung',
    description: 'Private Aufgaben, Projekte, Meilensteine und Fälligkeiten an einem ruhigen Ort.',
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      title: 'Meine Aufgaben & Planung',
      description: 'Aufgaben, Projekte und Termine an einem ruhigen Ort.',
      images: ['/og-private.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Meine Aufgaben & Planung',
      description: 'Aufgaben, Projekte und Termine an einem ruhigen Ort.',
      images: ['/og-private.png'],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
