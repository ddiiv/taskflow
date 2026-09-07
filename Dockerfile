# Un único servicio: frontend + backend + base SQLite en un contenedor.
# Sin dependencias nativas: la base la maneja el módulo `node:sqlite` de Node 24.
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATA_DIR=/data
COPY --from=build /app/.next/standalone ./
RUN mkdir -p /data
# Corre como root a propósito: los volúmenes que montan Railway, Fly o Docker
# aparecen como root:root, y un proceso sin privilegios no podría escribir la
# base. Si desplegás donde controlás el uid del volumen, podés agregar
# `RUN chown -R node:node /data /app` y `USER node`.
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server.js"]
