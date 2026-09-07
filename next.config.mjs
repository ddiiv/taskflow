/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empaqueta un servidor autocontenido en .next/standalone (ver scripts/postbuild.mjs).
  output: 'standalone',
  // Nota: NO usar `outputFileTracingExcludes` para sacar ./data del output.
  // Rompe el trazado de Next (el standalone queda sin next/dist/lib/metadata/*
  // y el servidor no arranca). La copia de data/ se borra en el postbuild.
};

export default nextConfig;
