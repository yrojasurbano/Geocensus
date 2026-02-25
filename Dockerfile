# Etapa de compilación
FROM node:22.14.0-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Etapa de servidor
FROM nginx:stable-alpine
# Ajusta esta ruta si tu proyecto se llama distinto en angular.json
COPY --from=build /app/dist/inei-census-dashboard-2025/browser /usr/share/nginx/html
# Configuración para Single Page Application
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80