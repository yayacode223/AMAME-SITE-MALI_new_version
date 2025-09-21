# Dockerfile pour React (Vite) - Build uniquement
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Image finale minimaliste - juste les fichiers statiques
FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache bash
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads/

# Exposition du port (pour health checks)
EXPOSE 3000

# Health check et serveur simple pour les tests
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["sh", "-c", "echo 'Frontend files are ready to be served by Caddy' && tail -f /dev/null"]