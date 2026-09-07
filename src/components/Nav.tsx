'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Project } from '@/lib/types';

export default function Nav({ projects }: { projects: Project[] }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">T</span>
        <span>
          <span className="brand-name">TaskFlow</span>
          <br />
          <span className="brand-sub">seguimiento</span>
        </span>
      </Link>

      <div>
        <div className="nav-label">General</div>
        <Link href="/" className="nav-item" data-active={pathname === '/'}>
          <span>▦</span> Panel
        </Link>
        <Link
          href="/equipo"
          className="nav-item"
          data-active={pathname === '/equipo'}
        >
          <span>◍</span> Equipo
        </Link>
      </div>

      <div>
        <div className="nav-label">Proyectos</div>
        {projects.length === 0 && (
          <div className="nav-empty">Todavía no hay proyectos.</div>
        )}
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/proyectos/${p.id}`}
            className="nav-item"
            data-active={pathname === `/proyectos/${p.id}`}
            title={p.name}
          >
            <span className="pkey">{p.key}</span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
