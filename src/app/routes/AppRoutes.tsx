// Routing der auf den Ausbildungsverlauf reduzierten App
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ChunkErrorBoundary } from '../components/ChunkErrorBoundary';

const AusbildungsverlaufView = lazy(() => import('../../features/ausbildung/components/AusbildungsverlaufView'));

function RouteLoadingState() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-gray-500">
      Seite wird geladen...
    </div>
  );
}

function AusbildungsverlaufRoute() {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<RouteLoadingState />}>
        <AusbildungsverlaufView />
      </Suspense>
    </ChunkErrorBoundary>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AusbildungsverlaufRoute />} />
      <Route path="/ausbildung" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
