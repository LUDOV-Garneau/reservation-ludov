FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

COPY scripts ./scripts

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"' >> /app/start.sh && \
    echo 'echo "LUDOV - Démarrage de l'\''application"' >> /app/start.sh && \
    echo 'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Démarrer Next.js en arrière-plan' >> /app/start.sh && \
    echo 'echo "Lancement du serveur Next.js..."' >> /app/start.sh && \
    echo 'node server.js &' >> /app/start.sh && \
    echo 'NEXTJS_PID=$!' >> /app/start.sh && \
    echo 'echo "Next.js démarré (PID: $NEXTJS_PID)"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Attendre que Next.js soit prêt' >> /app/start.sh && \
    echo 'echo "Attente du démarrage de Next.js..."' >> /app/start.sh && \
    echo 'sleep 10' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Démarrer le cron en arrière-plan' >> /app/start.sh && \
    echo 'echo "Lancement du planificateur de rappels..."' >> /app/start.sh && \
    echo 'node scripts/cron-scheduler.js &' >> /app/start.sh && \
    echo 'CRON_PID=$!' >> /app/start.sh && \
    echo 'echo "Planificateur démarré (PID: $CRON_PID)"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Application prête !"' >> /app/start.sh && \
    echo 'echo "   - Next.js sur le port 3000"' >> /app/start.sh && \
    echo 'echo "   - Cron job actif"' >> /app/start.sh && \
    echo 'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Fonction pour arrêter proprement les processus' >> /app/start.sh && \
    echo 'cleanup() {' >> /app/start.sh && \
    echo '    echo ""' >> /app/start.sh && \
    echo '    echo "Arrêt gracieux..."' >> /app/start.sh && \
    echo '    kill -TERM $CRON_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '    kill -TERM $NEXTJS_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '    wait $CRON_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '    wait $NEXTJS_PID 2>/dev/null || true' >> /app/start.sh && \
    echo '    echo "Arrêt terminé"' >> /app/start.sh && \
    echo '    exit 0' >> /app/start.sh && \
    echo '}' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Capturer les signaux d'\''arrêt' >> /app/start.sh && \
    echo 'trap cleanup SIGTERM SIGINT' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Attendre indéfiniment (les processus tournent en arrière-plan)' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]