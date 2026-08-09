// Projektübersicht der privaten Planung mit frei anlegbaren Projekten
import OrganizerApp from '../../src/features/organizer/components/OrganizerApp';

export const dynamic = 'force-dynamic';

export default function PlanningPage() {
  return <OrganizerApp initialSection="planning" />;
}
