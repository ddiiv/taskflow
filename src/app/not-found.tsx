import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1>No encontrado</h1>
          <p className="sub">Esa página no existe o el proyecto fue eliminado.</p>
        </div>
      </header>
      <div className="content">
        <div className="empty">
          <h3>404</h3>
          <p style={{ marginBottom: 16 }}>
            El enlace apunta a algo que ya no está.
          </p>
          <Link href="/" className="btn btn-primary">
            Volver al panel
          </Link>
        </div>
      </div>
    </>
  );
}
