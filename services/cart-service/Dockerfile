FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/cart-service/package.json ./services/cart-service/

RUN npm ci --workspace=services/cart-service --include-workspace-root

COPY services/cart-service/src ./services/cart-service/src
COPY services/cart-service/tsconfig*.json ./services/cart-service/
COPY services/cart-service/nest-cli.json ./services/cart-service/

WORKDIR /app/services/cart-service

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/cart-service/dist ./dist
COPY --from=builder /app/services/cart-service/package.json ./package.json

EXPOSE 3003

CMD ["node", "dist/main.js"]