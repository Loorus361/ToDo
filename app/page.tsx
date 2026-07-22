// Client-Seite, die ausschließlich den interaktiven Ausbildungsverlauf rendert
'use client';

import dynamic from 'next/dynamic';

const AusbildungsverlaufView = dynamic(
  () => import('../src/features/ausbildung/components/AusbildungsverlaufView'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Ausbildungsverlauf wird geladen…
      </div>
    ),
  },
);

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <main className="h-full p-3 sm:p-5 lg:p-8">
        <div className="mx-auto h-full w-full max-w-[1800px]">
          <AusbildungsverlaufView />
        </div>
      </main>
    </div>
  );
}
