# Etapa 1: Build con Node 22.14 (o superior)
FROM node:22.14-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servir con Nginx
FROM nginx:alpine
# Copiamos el build de Angular a la carpeta de Nginx
# OJO: Verifica que el nombre coincida con tu "outputPath" de angular.json
COPY --from=build /app/dist/inei-census-dashboard-2025/browser /usr/share/nginx/html

# Configuración para que las rutas de Angular (SPA) funcionen al refrescar
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]