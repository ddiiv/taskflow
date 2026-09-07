import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import { listProjects } from '@/lib/queries';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'TaskFlow — seguimiento de proyectos',
  description: 'Tablero simple de tareas y progreso por proyecto.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = listProjects();
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <Nav projects={projects} />
          <div className="main">{children}</div>
        </div>
      </body>
    </html>
  );
}
