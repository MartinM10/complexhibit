FROM node:20-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
# Ver https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine para entender por qué podría necesitarse libc6-compat.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias basándose en el gestor de paquetes preferido
COPY package.json package-lock.json* ./
RUN npm ci

# Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js recopila datos telemetría completamente anónimos sobre el uso general.
# Más información aquí: https://nextjs.org/telemetry
# Descomentar la siguiente línea en caso de querer deshabilitar telemetría durante el build.
# ENV NEXT_TELEMETRY_DISABLED 1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Descomentar la siguiente línea en caso de querer deshabilitar telemetría durante runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# No ejecutar como root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Establecer los permisos correctos para caché de prerender
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Aprovechar automáticamente output traces para reducir tamaño de imagen
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# Establecer hostname a localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
