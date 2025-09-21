# Dockerfile pour React (Vite) - Build uniquement
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Ajouter cette ligne pour ignorer le dossier uploads pendant le build
RUN find . -name "uploads" -type d -exec rm -rf {} + 2>/dev/null || true
RUN npm run build

# Image finale minimaliste - juste les fichiers statiques
FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache bash
COPY --from=builder /app/dist ./dist
# SUPPRIMER cette ligne - les uploads seront montés via volume
# COPY --from=builder /app/uploads ./uploads/

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["sh", "-c", "echo 'Frontend files are ready to be served by Caddy' && tail -f /dev/null"]