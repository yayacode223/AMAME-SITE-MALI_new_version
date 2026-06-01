# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# 1. Augmenter le timeout et les retries npm pour réseau instable
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000

# 2. Copier uniquement les fichiers de dépendances
COPY package.json package-lock.json ./

# 3. Installer avec cache BuildKit (évite de tout re-télécharger à chaque rebuild)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --quiet

# 4. Copier le reste du code source
COPY . .

# 5. Builder l'application
RUN npm run build

FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]