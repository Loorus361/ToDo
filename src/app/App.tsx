// Root-Komponente der schlanken Ausbildungsverlauf-App
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: 'rgb(var(--bg-main))' }}>
      <main className="h-full p-3 sm:p-5 lg:p-8">
        <div className="mx-auto h-full w-full max-w-[1800px]">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}
