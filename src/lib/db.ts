import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { SCHEMA } from './schema.mjs';

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

function create(): Db {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  // enableForeignKeyConstraints viene en true por defecto.
  const raw = new DatabaseSync(path.join(DATA_DIR, 'taskflow.db'));
  raw.exec('PRAGMA journal_mode = WAL');
  const db = new Db(raw);
  db.exec(SCHEMA);
  return db;
}

// Next.js recarga módulos en dev; una sola conexión por proceso.
const globalForDb = globalThis as unknown as { __taskflowDb?: Db };
export const db = globalForDb.__taskflowDb ?? create();
if (process.env.NODE_ENV !== 'production') globalForDb.__taskflowDb = db;
