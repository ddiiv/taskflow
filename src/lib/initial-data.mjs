// Data inicial del equipo: personas, proyectos y tareas.
//
// La usan dos cosas:
//   - scripts/seed.mjs        (npm run seed, desde la línea de comandos)
//   - src/lib/db.ts           (carga automática al arrancar con SEED_ON_START,
//                              útil cuando el volumen del servidor está vacío)
//
// Es la única fuente de verdad: si cambia acá, cambia en los dos lados.

/** Último día del mes actual, en formato YYYY-MM-DD. */
function finDeMes() {
  const d = new Date();
  // sv-SE ya devuelve YYYY-MM-DD, y en hora local (no corre la fecha por UTC).
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('sv-SE');
}

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#0ea5e9'];

export const EQUIPO = [
  ['Dante', 'Admin'],
  ['Gus', 'Admin'],
  ['Brenda', 'Empleada'],
  ['Rebeca', 'Empleada'],
  ['Fer', 'Empleado'],
  ['Ruth', 'Dueña'],
];

// Las tareas van en el orden que el equipo definió: de más urgente a menos
// importante. Ese orden es el que queda en el tablero y el que marca la prioridad.
export const PROYECTOS = [
  {
    key: 'MELI',
    name: 'Reactivación MercadoLibre',
    description: 'Poner la cuenta a punto: publicaciones, precios, fotos y postventa.',
    lead: 'Gus',
    tasks: [
      {
        title: 'Revisar todas las publicaciones y clasificarlas',
        detail:
          'Determinar cuáles se modifican, cuáles se eliminan y cuáles se vuelven a publicar. Separar las que están performando de las que ya no se van a usar más.',
        assignee: 'Gus',
        priority: 'urgent',
      },
      {
        title: 'Sincronizar las publicaciones con los SKU de STOCKER',
        assignee: 'Gus',
        priority: 'urgent',
      },
      {
        title: 'Actualización de precios de todas las publicaciones',
        detail:
          'Tener en cuenta el concepto de ventas volumétricas: no enfocarnos en la ganancia por unidad sino en las ventas masivas, para reputar.',
        assignee: 'Gus',
        priority: 'high',
      },
      {
        title: 'Reactivación con garantía de 75 mil por 120 días',
        detail: 'A cargo de Dante junto con Ruth.',
        assignee: 'Dante',
        priority: 'high',
      },
      {
        title: 'Fotos de publicaciones: sacar fondo con remove.bg',
        detail:
          'A todas las publicaciones. remove.bg es el que mejor resultado da para que la IA de ML no moleste.',
        assignee: 'Dante',
        priority: 'medium',
      },
      {
        title: 'Buscar una automatización de mensajes gratuita',
        detail:
          'Tiene que ser gratis y no requerir mostrar datos de contacto.',
        assignee: 'Dante',
        priority: 'low',
      },
    ],
  },
  {
    key: 'GOOG',
    name: 'Google',
    description: 'Reseñas, catálogo de productos y posicionamiento.',
    lead: 'Dante',
    tasks: [
      {
        title: 'Generar QR para reseñas en el local de Boyacá',
        assignee: 'Dante',
        priority: 'urgent',
      },
      {
        title: 'Pedir reseñas a los clientes por mail y por WhatsApp',
        detail: 'A cargo de Gus junto con Rebeca.',
        assignee: 'Gus',
        priority: 'high',
      },
      {
        title: 'Subir productos al catálogo de Google',
        assignee: 'Dante',
        priority: 'medium',
      },
      {
        title: 'Posicionamiento SEO',
        assignee: 'Dante',
        priority: 'low',
      },
    ],
  },
  {
    key: 'ATA',
    name: 'A un toque Avellaneda',
    description: 'Reactivar la cuenta y actualizarla para la temporada de verano.',
    lead: 'Gus',
    tasks: [
      { title: 'Reactivar publicaciones', assignee: 'Gus', priority: 'urgent' },
      {
        title: 'Actualizar precios y fotos de las publicaciones',
        detail: 'Temporada de verano.',
        assignee: 'Gus',
        priority: 'high',
      },
      { title: 'Subir nuevos productos', assignee: 'Gus', priority: 'medium' },
    ],
  },
  {
    key: 'MAQ',
    name: 'Presupuestos de máquinas para locales',
    description: 'Equipamiento para los locales y el depósito.',
    lead: 'Dante',
    tasks: [
      {
        title: 'Buscar presupuestos de tablets y PC all-in-one',
        detail:
          'Para los locales y una para depósito. La tablet tiene que poder conectar una impresora; si no, buscar una impresora inalámbrica.',
        assignee: 'Dante',
        priority: 'urgent',
      },
    ],
  },
  {
    key: 'STK',
    name: 'Stocker',
    description: 'Facturación, legales e integración con MercadoLibre.',
    lead: 'Dante',
    tasks: [
      {
        title: 'Poner términos y condiciones',
        assignee: 'Dante',
        priority: 'urgent',
      },
      {
        title: 'Facturación ARCA funcionando',
        detail: 'Tiene que estar operativa para fin de mes.',
        assignee: 'Dante',
        priority: 'urgent',
        due: finDeMes(),
      },
      {
        title: 'Optimizar la sección MercadoLibre y envíos MercadoLibre',
        assignee: 'Dante',
        priority: 'high',
      },
      {
        title: 'Ver en la sección MercadoLibre los mensajes de los clientes',
        assignee: 'Dante',
        priority: 'medium',
      },
      {
        title: 'Ver los reclamos que afectan a la cuenta y llevarles seguimiento',
        detail: 'Dentro de la sección MercadoLibre.',
        assignee: 'Dante',
        priority: 'medium',
      },
    ],
  },
  {
    key: 'JUMP',
    name: 'Jumpseller',
    description: 'Pasar la tienda a temporada de verano y sincronizarla con Stocker.',
    lead: null,
    tasks: [
      {
        title: 'Pasar toda la colección de invierno a verano',
        detail: 'Fotos, títulos y precios.',
        assignee: null,
        priority: 'urgent',
      },
      {
        title: 'Cambiar títulos de la página, banners y diseño a verano',
        assignee: null,
        priority: 'high',
      },
      {
        title: 'Sincronizar todos los SKU con Stocker',
        assignee: null,
        priority: 'high',
      },
      {
        title: 'Mejorar la vidriera y la vista de productos',
        assignee: null,
        priority: 'medium',
      },
    ],
  },
];

/**
 * Inserta el equipo, los proyectos y las tareas.
 *
 * `db` puede ser un DatabaseSync de node:sqlite o el wrapper de src/lib/db.ts:
 * sólo se le pide `prepare(sql).run(...)`.
 *
 * No borra nada: llamalo sobre una base vacía.
 */
export function loadInitialData(db) {
  const insMember = db.prepare(
    'INSERT INTO members (name, email, role, color) VALUES (?, ?, ?, ?)',
  );
  const miembro = new Map(
    EQUIPO.map(([name, role], i) => [
      name,
      Number(insMember.run(name, null, role, COLORS[i % COLORS.length]).lastInsertRowid),
    ]),
  );

  const insProject = db.prepare(
    'INSERT INTO projects (key, name, description, lead_id) VALUES (?, ?, ?, ?)',
  );
  const insTask = db.prepare(
    `INSERT INTO tasks
       (project_id, seq, title, description, status, priority, type, assignee_id, due_date, position)
     VALUES (?, ?, ?, ?, 'todo', ?, 'task', ?, ?, ?)`,
  );

  let tareas = 0;
  for (const p of PROYECTOS) {
    const projectId = Number(
      insProject.run(p.key, p.name, p.description ?? null, miembro.get(p.lead) ?? null)
        .lastInsertRowid,
    );

    p.tasks.forEach((t, i) => {
      insTask.run(
        projectId,
        i + 1, // seq -> MELI-1, MELI-2, …
        t.title,
        t.detail ?? null,
        t.priority,
        miembro.get(t.assignee) ?? null,
        t.due ?? null,
        i + 1, // position -> el orden de urgencia
      );
      tareas += 1;
    });
  }

  return { personas: miembro.size, proyectos: PROYECTOS.length, tareas };
}
