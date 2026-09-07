# TaskFlow

Seguimiento de tareas y proyectos, tipo JIRA pero mínimo. **Un solo servicio**:
Next.js sirve el frontend y el backend en el mismo proceso, y los datos van a un
archivo SQLite. No hay API externa, ni Redis, ni base de datos aparte que
desplegar.

**Cero dependencias nativas**: la base usa el módulo `node:sqlite` que viene
dentro de Node, así que no hay `node-gyp`, ni compilación en el `npm install`,
ni binarios atados a la versión de Node. Requiere **Node 24 o superior**
(hay un `.nvmrc`: `nvm use` y listo).

## Qué hace

- **Proyectos** con clave (`WEB-1`, `APP-3`…), descripción y responsable.
- **Tablero Kanban** con 4 columnas — Por hacer / En progreso / En revisión / Hecho —
  y drag & drop para mover y reordenar tareas.
- **Tareas** con título, descripción, responsable, prioridad, tipo (tarea / bug /
  historia) y fecha límite. Las vencidas se marcan en rojo.
- **Seguimiento**: comentarios por tarea, con autor y fecha.
- **Progreso**: porcentaje completado y distribución por estado, por proyecto y global.
- **Equipo**: alta de personas y cuánta carga tiene cada una.
- Filtros por responsable, prioridad y texto; modo claro y oscuro automáticos.

## Correr en local

```bash
nvm use          # Node 24+ (o asegurate de tenerlo en el PATH)
npm install
npm run seed     # opcional: carga 2 proyectos y 13 tareas de ejemplo
npm run dev      # http://localhost:3000
```

Producción:

```bash
npm run build
npm start
```

`npm start` levanta el servidor autocontenido de `.next/standalone`: un solo
proceso Node que sirve el HTML, las Server Actions y los estáticos.

La base se crea sola en `./data/taskflow.db` la primera vez que arranca.

## Desplegar

### Docker (recomendado)

```bash
docker compose up -d --build
```

Queda en `http://localhost:3000` y los datos persisten en el volumen
`taskflow-data`. Para un VPS alcanza con eso más un nginx/Caddy adelante para el
TLS.

### Railway

Railway detecta el `Dockerfile` solo. Los dos puntos que importan son el
**volumen** y la **carga inicial**.

1. **New Project → Deploy from GitHub repo** y elegí este repo.
2. **Agregá un volumen** con mount path `/data`. Sin esto el disco es efímero
   y perdés la base en cada redeploy. Es el paso que más se olvida.
3. **Variables** del servicio:

   | Variable         | Valor  | Para qué                                     |
   |------------------|--------|----------------------------------------------|
   | `SEED_ON_START`  | `true` | Carga la data inicial si la base está vacía  |
   | `DATA_DIR`       | `/data`| Ya viene en el Dockerfile; explicitarlo no molesta |

   `SEED_ON_START` es idempotente: sólo actúa si no hay ningún proyecto. Se
   puede dejar prendido como red de seguridad por si el volumen se pierde.
4. **Settings → Networking → Generate Domain**. El puerto es el `3000` que
   expone la imagen; si Railway inyecta `PORT`, el servidor lo respeta.
5. Deploy y abrí la URL.

Cosas a tener en cuenta:

- **Una sola instancia.** SQLite quiere un único proceso escribiendo: no
  escales réplicas.
- El contenedor corre como root a propósito, porque los volúmenes se montan
  como `root:root` y si no el proceso no podría escribir la base.
- Los volúmenes requieren un plan pago de Railway.
- Para respaldar, entrá con `railway ssh` y copiá `/data/taskflow.db`.

### Sin Docker

```bash
npm ci && npm run build
DATA_DIR=/var/lib/taskflow PORT=3000 npm start
```

Con `pm2` o una unit de systemd para que levante solo.

### Variables de entorno

| Variable         | Default  | Para qué                                          |
|------------------|----------|---------------------------------------------------|
| `PORT`           | `3000`   | Puerto HTTP                                       |
| `DATA_DIR`       | `./data` | Carpeta de `taskflow.db`                          |
| `SEED_ON_START`  | apagado  | Si vale `true`, carga la data inicial cuando la base está vacía |

La imagen de Docker parte de `node:24-slim` y no instala compiladores: el
`npm ci` no ejecuta ningún script de instalación.

> **Ojo con serverless.** SQLite necesita un disco persistente y un solo proceso
> escribiendo. Anda perfecto en un VPS, Docker, Fly.io, Render o Railway con
> volumen montado. En Vercel/Lambda **no**: cada invocación tiene su propio disco
> efímero y perderías los datos. Si algún día lo necesitás ahí, hay que cambiar
> `src/lib/db.ts` por Postgres — el resto del código no se entera, porque toda
> la SQL está en `db.ts`, `queries.ts` y `actions.ts`.

## Estructura

```
src/
  app/
    page.tsx                  panel general (proyectos + próximas tareas)
    proyectos/[id]/page.tsx   tablero del proyecto
    equipo/page.tsx           personas y carga de trabajo
    layout.tsx, globals.css   shell y estilos (CSS plano, sin Tailwind)
  components/
    Board.tsx                 tablero Kanban + drag & drop (cliente)
    TaskDialog.tsx            alta/edición de tarea + comentarios
    ProjectDialog.tsx, MemberDialog.tsx, Nav.tsx, ui.tsx, bits.tsx, Avatar.tsx
  lib/
    db.ts                     conexión (node:sqlite), tablas y carga inicial
    initial-data.mjs          el equipo, los proyectos y las tareas de arranque
    schema.mjs                el SQL de las tablas (lo comparten app y seed)
    queries.ts                lecturas
    actions.ts                escrituras (Server Actions)
    types.ts, format.ts
scripts/seed.mjs              datos de ejemplo (`npm run seed -- --force` reinicia)
```

Las mutaciones son **Server Actions**: los formularios postean directo al
servidor, sin capa de API ni fetch a mano. Por eso no hay carpeta `api/`.

## Lo que no tiene (a propósito)

- **Autenticación.** Cualquiera que llegue a la URL puede editar todo. Para un
  equipo interno, ponelo detrás de una VPN o de un `basic auth` en nginx. Si
  necesitás login de verdad, el lugar es un `middleware.ts` + una tabla `users`.
- Sprints, epics, workflows configurables, adjuntos, notificaciones por mail.
- Historial de cambios (sí hay comentarios, que cubren el 90% del caso).

## Backup

Es un archivo. Se copia y listo:

```bash
sqlite3 data/taskflow.db ".backup 'backup-$(date +%F).db'"
```
