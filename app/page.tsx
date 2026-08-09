// Startseite der privaten App mit der persönlichen Aufgabenübersicht
import OrganizerApp from '../src/features/organizer/components/OrganizerApp';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <OrganizerApp initialSection="tasks" />;
}
