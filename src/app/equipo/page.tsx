import Avatar from '@/components/Avatar';
import MemberDialog from '@/components/MemberDialog';
import { workload } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function TeamPage() {
  const people = workload();

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Equipo</h1>
          <p className="sub">
            Quiénes pueden recibir tareas y cuánto tienen encima.
          </p>
        </div>
        <div className="topbar-actions">
          <MemberDialog label="+ Agregar persona" />
        </div>
      </header>

      <div className="content">
        {people.length === 0 ? (
          <div className="empty">
            <h3>El equipo está vacío</h3>
            <p style={{ marginBottom: 16 }}>
              Agregá gente para poder asignarle tareas en los tableros.
            </p>
            <MemberDialog label="+ Agregar persona" />
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th style={{ width: 150 }}>Rol</th>
                  <th style={{ width: 100 }}>Abiertas</th>
                  <th style={{ width: 100 }}>Vencidas</th>
                  <th style={{ width: 110 }}>Completadas</th>
                  <th style={{ width: 90 }} />
                </tr>
              </thead>
              <tbody>
                {people.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar member={m} />
                        <span>
                          <b style={{ fontWeight: 600 }}>{m.name}</b>
                          <br />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {m.email || '—'}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>{m.role || <span style={{ color: 'var(--faint)' }}>—</span>}</td>
                    <td>{m.open}</td>
                    <td className={m.overdue ? 'overdue' : undefined}>{m.overdue}</td>
                    <td>{m.done}</td>
                    <td style={{ textAlign: 'right' }}>
                      <MemberDialog
                        member={m}
                        label="Editar"
                        className="btn btn-ghost btn-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
