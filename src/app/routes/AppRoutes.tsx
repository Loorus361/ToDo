// Zentrale Route-Definitionen aller Feature-Seiten der App
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { PageSection } from '../components/PageSection';

const KanbanBoard = lazy(() => import('../../features/kanban/components/KanbanBoard'));
const ProjectsView = lazy(() => import('../../features/projects/components/ProjectsView'));
const ProjectDetail = lazy(() => import('../../features/projects/components/ProjectDetail'));
const ContactsView = lazy(() => import('../../features/contacts/components/ContactsView'));
const SettingsView = lazy(() => import('../../features/settings/components/SettingsView'));
const AusbildungsverlaufView = lazy(() => import('../../features/ausbildung/components/AusbildungsverlaufView'));
const HonorarView = lazy(() => import('../../features/honorar/components/HonorarView'));

function RouteLoadingState() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-gray-500">
      Seite wird geladen...
    </div>
  );
}

function withRouteSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<RouteLoadingState />}>
      {element}
    </Suspense>
  );
}

function ProjectDetailRoute() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const parsedProjectId = Number(projectId);

  if (!projectId || Number.isNaN(parsedProjectId)) {
    return <Navigate to="/projects" replace />;
  }

  return (
    withRouteSuspense(
      <ProjectDetail
        projectId={parsedProjectId}
        onBack={() => navigate('/projects')}
      />
    )
  );
}

export function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={withRouteSuspense(
          <PageSection title="Dashboard" fullHeight>
            <KanbanBoard />
          </PageSection>
        )}
      />
      <Route
        path="/projects"
        element={withRouteSuspense(
          <ProjectsView onSelectProject={(projectId) => navigate(`/projects/${projectId}`)} />
        )}
      />
      <Route path="/projects/:projectId" element={<ProjectDetailRoute />} />
      <Route path="/contacts" element={withRouteSuspense(<ContactsView />)} />
      <Route
        path="/ausbildung"
        element={withRouteSuspense(
          <PageSection fullHeight>
            <AusbildungsverlaufView />
          </PageSection>
        )}
      />
      <Route
        path="/honorar"
        element={withRouteSuspense(
          <PageSection fullHeight>
            <HonorarView />
          </PageSection>
        )}
      />
      <Route path="/settings" element={withRouteSuspense(<SettingsView />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
