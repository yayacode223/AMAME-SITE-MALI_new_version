FROM node:22-alpine AS builder

WORKDIR /app

# 1. Copier uniquement les fichiers de dépendances
COPY package.json package-lock.json ./

# 2. Installer les dépendances AVANT de copier le code source
RUN npm ci --legacy-peer-deps --quiet

# 3. Maintenant copier le reste du code source
COPY . .

# 4. Builder l'application
RUN npm run build

FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]