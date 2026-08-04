# syntax=docker/dockerfile:1.7

# ---------- deps (dev + prod, pour le build) ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- prod-deps ----------
# Nécessaire parce que scripts/ n'est pas dans le graphe de Next,
# donc ses dépendances ne sont pas tracées par output: standalone.
# Supprimable si tu ajoutes outputFileTracingIncludes dans next.config.
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Si tu utilises t3-env / une validation zod au build.
# Aucun vrai secret ici : JWT_SECRET est injecté au runtime par Coolify.
ENV SKIP_ENV_VALIDATION=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
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

# Le script one-shot exécuté par les Scheduled Tasks de Coolify,
# plus ses dépendances de prod.
COPY --from=build     --chown=nextjs:nodejs /app/src/scripts  ./scripts
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

# Un seul processus. Si server.js meurt, le conteneur meurt et Coolify redémarre.
CMD ["node", "server.js"]
