import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { SCHEMA } from './schema.mjs';
import { loadInitialData } from './initial-data.mjs';

/**
 * Dónde vive taskflow.db. Por defecto `<raíz del proyecto>/data`.
 * El servidor standalone hace chdir a .next/standalone, así que hay que subir
 * dos niveles para que `npm run dev` y `npm start` usen la misma base.
 */
function defaultDataDir(): string {
  const cwd = process.cwd();
  const marker = path.join('.next', 'standalone');
  const root = cwd.endsWith(marker) ? path.resolve(cwd, '..', '..') : cwd;
  return path.join(root, 'data');
}

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : defaultDataDir();

/**
 * node:sqlite devuelve filas con prototipo null. React se niega a mandar eso a
 * un Client Component, así que las copiamos a objetos comunes al salir.
 */
const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;

/** Todo lo que la app llega a bindear. */
type SqlParam = null | number | bigint | string;

class Stmt<T> {
  constructor(private readonly stmt: StatementSync) {}

  get(...params: SqlParam[]): T | undefined {
    const row = this.stmt.get(...params);
    return row === undefined ? undefined : plain<T>(row);
  }

  all(...params: SqlParam[]): T[] {
    return this.stmt.all(...params).map((r) => plain<T>(r));
  }

  run(...params: SqlParam[]): { changes: number; lastInsertRowid: number } {
    const r = this.stmt.run(...params);
    return {
      changes: Number(r.changes),
      lastInsertRowid: Number(r.lastInsertRowid),
    };
  }
}

class Db {
  constructor(private readonly raw: DatabaseSync) {}

  exec(sql: string): void {
    this.raw.exec(sql);
  }

  prepare<T = unknown>(sql: string): Stmt<T> {
    return new Stmt<T>(this.raw.prepare(sql));
  }

  /** Todo o nada. node:sqlite no trae helper de transacciones. */
  tx<T>(fn: () => T): T {
    this.raw.exec('BEGIN');
    try {
      const out = fn();
      this.raw.exec('COMMIT');
      return out;
    } catch (err) {
      this.raw.exec('ROLLBACK');
      throw err;
    }
  }
}

/**
 * Con SEED_ON_START=true, si la base está vacía carga la data inicial.
 *
 * Es para el primer arranque en un servidor con volumen nuevo (Railway, Fly,
 * Docker), donde no hay una forma cómoda de correr `npm run seed` adentro del
 * contenedor. Es idempotente: si ya hay proyectos no toca nada, así que se
 * puede dejar prendido como red de seguridad.
 */
function maybeSeed(db: Db): void {
  const flag = (process.env.SEED_ON_START ?? '').toLowerCase();
  if (flag !== '1' && flag !== 'true') return;

  const row = db.prepare<{ n: number }>('SELECT COUNT(*) AS n FROM projects').get();
  if (!row || row.n > 0) return;

  const r = db.tx(() => loadInitialData(db));
  console.log(
    `[taskflow] Base vacía: cargada la data inicial (${r.personas} personas, ${r.proyectos} proyectos, ${r.tareas} tareas).`,
  );
}

function create(): Db {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
  } catch (err) {
    throw new Error(
      `No se puede escribir en DATA_DIR (${DATA_DIR}). ` +
        'Si estás en un contenedor con volumen montado, revisá que el usuario ' +
        `del proceso (uid ${typeof process.getuid === 'function' ? process.getuid() : '?'}) ` +
        `tenga permiso sobre ese directorio. Causa: ${(err as Error).message}`,
    );
  }

  // enableForeignKeyConstraints viene en true por defecto.
  const raw = new DatabaseSync(path.join(DATA_DIR, 'taskflow.db'));
  raw.exec('PRAGMA journal_mode = WAL');
  const db = new Db(raw);
  db.exec(SCHEMA);
  maybeSeed(db);
  return db;
}

// Next.js recarga módulos en dev; una sola conexión por proceso.
const globalForDb = globalThis as unknown as { __taskflowDb?: Db };

function getDb(): Db {
  if (!globalForDb.__taskflowDb) {
    globalForDb.__taskflowDb = create();
  }
  return globalForDb.__taskflowDb;
}

// Conexión perezosa: importar este módulo no debe abrir ni escribir la base.
// Next.js importa este módulo al recolectar datos de las páginas durante el
// build, y abrir la conexión en ese momento puede causar "database is
// locked" por escrituras concurrentes al mismo archivo SQLite. Con el Proxy,
// la conexión real recién se crea cuando se llama un método (prepare, exec).
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop as keyof typeof real];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
