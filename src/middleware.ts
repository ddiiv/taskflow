import { NextResponse, type NextRequest } from 'next/server';

/**
 * Autenticación básica HTTP para toda la app.
 *
 * Se activa sola cuando existe AUTH_PASSWORD. Sin esa variable la app queda
 * abierta, que es lo cómodo en local; en el servidor, ponela.
 *
 * Es a propósito lo más simple que cierra la puerta: no hay usuarios ni
 * sesiones, es una sola credencial compartida por el equipo. Alcanza para una
 * herramienta interna detrás de una URL pública. Si algún día hace falta saber
 * quién hizo qué, hay que pasar a login con sesión y una tabla de usuarios.
 */
export function middleware(req: NextRequest) {
  // Se lee acá adentro y no en el módulo: así el valor sale del entorno del
  // servidor en cada arranque y no queda horneado en el build.
  const expectedUser = process.env.AUTH_USER || 'admin';
  const expectedPassword = process.env.AUTH_PASSWORD || '';

  if (!expectedPassword) return NextResponse.next();

  const header = req.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = '';
    }
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const user = decoded.slice(0, sep);
      const password = decoded.slice(sep + 1);
      if (equals(user, expectedUser) && equals(password, expectedPassword)) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Necesitás iniciar sesión para entrar a TaskFlow.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="TaskFlow", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

/** Comparación en tiempo constante, para no filtrar la contraseña de a caracteres. */
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const config = {
  // Todo queda protegido salvo los assets estáticos del build, que no llevan
  // datos. Las páginas, las Server Actions y los payloads RSC sí pasan por acá.
  matcher: ['/((?!_next/|icon.svg|favicon.ico).*)'],
};
