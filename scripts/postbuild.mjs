// `output: standalone` deja en .next/standalone un servidor autocontenido, pero
// Next no copia ahí los archivos estáticos. Esto los pone en su lugar para que
// `npm start` (y la imagen de Docker) sirvan un solo directorio.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standalone)) {
  console.error('No existe .next/standalone — ¿corriste "next build"?');
  process.exit(1);
}

const copies = [
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
  [path.join(root, 'public'), path.join(standalone, 'public')],
];

for (const [from, to] of copies) {
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true });
}

// El trazado de Next arrastra la carpeta data/ al output. Esa copia no la usa
// nadie (el servidor resuelve la base contra la raíz del proyecto) y sería una
// base vieja viajando dentro de la imagen: fuera.
const strayData = path.join(standalone, 'data');
if (fs.existsSync(strayData)) {
  fs.rmSync(strayData, { recursive: true, force: true });
  console.log('Copia sobrante de data/ eliminada del output.');
}

console.log('Estáticos copiados a .next/standalone.');
