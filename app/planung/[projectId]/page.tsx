// URL-basierte Detailseite für ein persönliches Planungsprojekt
import OrganizerApp from '../../../src/features/organizer/components/OrganizerApp';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <OrganizerApp initialSection="planning" initialProjectId={projectId} />;
}
