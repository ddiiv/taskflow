// Carga la data inicial (src/lib/initial-data.mjs) en la base.
//
//   npm run seed              carga si la base está vacía
//   npm run seed -- --force   borra todo y vuelve a cargar
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA } from '../src/lib/schema.mjs';
import { loadInitialData } from '../src/lib/initial-data.mjs';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'taskflow.db'));
db.exec(SCHEMA);

const force = process.argv.includes('--force');
const used = db.prepare('SELECT COUNT(*) AS n FROM projects').get().n;

if (used && !force) {
  console.log(`La base ya tiene ${used} proyecto(s). Usá --force para reiniciarla.`);
  process.exit(0);
}

if (force) {
  db.exec('DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM members;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('comments','tasks','projects','members')");
}

const r = loadInitialData(db);
console.log(`Cargado: ${r.personas} personas, ${r.proyectos} proyectos, ${r.tareas} tareas.`);
console.log(`Base: ${path.join(DATA_DIR, 'taskflow.db')}`);
