FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/order-service/package.json ./services/order-service/
COPY services/order-service/prisma ./services/order-service/prisma/

RUN npm ci --workspace=services/order-service

COPY services/order-service/src ./services/order-service/src
COPY services/order-service/tsconfig*.json ./services/order-service/
COPY services/order-service/nest-cli.json ./services/order-service/
COPY services/order-service/prisma.config.ts ./services/order-service/

WORKDIR /app/services/order-service

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/order-service/dist ./dist
COPY --from=builder /app/services/order-service/prisma ./prisma
COPY --from=builder /app/services/order-service/package.json ./package.json

EXPOSE 3004

CMD ["node", "dist/main.js"]