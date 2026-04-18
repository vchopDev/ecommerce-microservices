FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/user-service/package.json ./services/user-service/
COPY services/user-service/prisma ./services/user-service/prisma/

RUN npm ci --workspace=services/user-service

COPY services/user-service/src ./services/user-service/src
COPY services/user-service/tsconfig*.json ./services/user-service/
COPY services/user-service/nest-cli.json ./services/user-service/
COPY services/user-service/prisma.config.ts ./services/user-service/

WORKDIR /app/services/user-service

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/prisma ./prisma
COPY --from=builder /app/services/user-service/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]