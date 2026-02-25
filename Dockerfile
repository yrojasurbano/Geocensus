# Etapa de compilación con Alpine
FROM node:22.14.0-alpine AS build
WORKDIR /app
COPY package*.json ./
# Instalamos dependencias
RUN npm install
COPY . .
# Construimos la app
RUN npm run build -- --configuration production

# Etapa de servidor con Alpine
FROM nginx:stable-alpine
# IMPORTANTE: Verifica esta ruta en tu angular.json
COPY --from=build /app/dist/inei-census-dashboard-2025/browser /usr/share/nginx/html

# Configuración SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80