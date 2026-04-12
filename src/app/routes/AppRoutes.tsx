// Zentrale Route-Definitionen aller Feature-Seiten der App
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import KanbanBoard from '../../features/kanban/components/KanbanBoard';
import ProjectsView from '../../features/projects/components/ProjectsView';
import ProjectDetail from '../../features/projects/components/ProjectDetail';
import ContactsView from '../../features/contacts/components/ContactsView';
import SettingsView from '../../features/settings/components/SettingsView';
import AusbildungsverlaufView from '../../features/ausbildung/components/AusbildungsverlaufView';
import HonorarView from '../../features/honorar/components/HonorarView';
import { PageSection } from '../components/PageSection';

function ProjectDetailRoute() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const parsedProjectId = Number(projectId);

  if (!projectId || Number.isNaN(parsedProjectId)) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <ProjectDetail
      projectId={parsedProjectId}
      onBack={() => navigate('/projects')}
    />
  );
}

export function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <PageSection title="Dashboard" fullHeight>
            <KanbanBoard />
          </PageSection>
        )}
      />
      <Route
        path="/projects"
        element={<ProjectsView onSelectProject={(projectId) => navigate(`/projects/${projectId}`)} />}
      />
      <Route path="/projects/:projectId" element={<ProjectDetailRoute />} />
      <Route path="/contacts" element={<ContactsView />} />
      <Route
        path="/ausbildung"
        element={(
          <PageSection fullHeight>
            <AusbildungsverlaufView />
          </PageSection>
        )}
      />
      <Route
        path="/honorar"
        element={(
          <PageSection fullHeight>
            <HonorarView />
          </PageSection>
        )}
      />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
