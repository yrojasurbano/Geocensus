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

# Instalamos servidor estático ligero
RUN npm install -g serve

# Copiamos solo la carpeta compilada
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Servimos el frontend compilado
CMD ["serve", "-s", "dist", "-l", "3000"]