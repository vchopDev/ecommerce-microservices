FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/catalog-service/package.json ./services/catalog-service/

RUN npm ci --workspace=services/catalog-service --include-workspace-root

COPY services/catalog-service/src ./services/catalog-service/src
COPY services/catalog-service/tsconfig*.json ./services/catalog-service/
COPY services/catalog-service/nest-cli.json ./services/catalog-service/

WORKDIR /app/services/catalog-service

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/catalog-service/dist ./dist
COPY --from=builder /app/services/catalog-service/package.json ./package.json

EXPOSE 3002

CMD ["node", "dist/main.js"]