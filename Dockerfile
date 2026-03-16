# Etapa 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Imagen final
FROM node:20-alpine AS runner
WORKDIR /app

# Servidor estático ligero
RUN npm install -g serve
RUN rm -rf ./dist

# Copiamos la carpeta compilada correcta
COPY --from=builder /app/dist/app/browser ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Servimos el frontend compilado apuntando a la carpeta con index.html
CMD ["serve", "-s", "dist", "-l", "3000"]