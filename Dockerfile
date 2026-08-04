# syntax=docker/dockerfile:1.7

# ---------- deps (dev + prod, pour le build) ----------
FROM node:24-alpine AS deps
WORKDIR /app
# bcrypt est un module natif sans prébuilt musl : il faut le compiler
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

# ---------- prod-deps (pour src/scripts, non tracé par Next) ----------
FROM node:24-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV JWT_SECRET=placeholder-build-only
# Aucun vrai secret ici : JWT_SECRET est injecté au runtime par Coolify
ENV SKIP_ENV_VALIDATION=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S nextjs -G nodejs

# standalone contient déjà server.js, package.json et le node_modules tracé
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public          ./public

# Script exécuté par les Scheduled Tasks de Coolify + ses dépendances de prod
# (node-cron, nodemailer, drizzle-orm, mysql2, dotenv)
COPY --from=build     --chown=nextjs:nodejs /app/src/scripts  ./scripts
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]