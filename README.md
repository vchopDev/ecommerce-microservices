# Scalable E-Commerce Platform

A scalable e-commerce backend built with a microservices architecture using NestJS, TypeScript, and Docker. Includes a React admin dashboard for product and category management.

> Part of the [Backend Developer Projects](https://roadmap.sh/projects/scalable-ecommerce-platform) path on roadmap.sh — built as a learning project and portfolio piece.

## Architecture

Multiple independent services communicate through an API Gateway (synchronous REST) and RabbitMQ (async events).

```
Clients (web / mobile / admin)
        │
   API Gateway
        │
  ┌─────┴─────────────────────────────────────┐
  │         │         │         │             │
Users   Catalog    Cart     Orders       Payments
                                              │
                                       Notifications
                                    (via RabbitMQ events)
```

## Tech stack

### Backend
- **Framework**: NestJS with Fastify adapter
- **Language**: TypeScript
- **Message bus**: RabbitMQ
- **Databases**: PostgreSQL · MongoDB · Redis
- **Containerisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monorepo**: Nx

### Frontend
- **Admin dashboard**: React + Vite + Tailwind CSS + shadcn/ui
- **Storefront**: Next.js (planned)

## Getting started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose
- npm 10+

## Environment setup

Each service and app has a `.env.example` file. Copy it to `.env` and fill in your values:

```bash
cp services/user-service/.env.example services/user-service/.env
cp services/catalog-service/.env.example services/catalog-service/.env
cp services/cart-service/.env.example services/cart-service/.env
cp apps/admin/.env.example apps/admin/.env
```

## Docker

Local development only. Production uses managed cloud databases.

```bash
# start dev databases
docker compose up -d

# start test databases
docker compose -f docker-compose.test.yml up -d
```

## Running the project

```bash
# install all dependencies from root
npm install

# start all backend services together
npm run start:all

# start the admin dashboard
cd apps/admin
npm run dev

# or start a single backend service
cd services/user-service
npm run start:dev
```

## Build

```bash
# build all projects
npm run build:all

# build a specific project
npx nx run @app/user-service:build
```

## Test

```bash
# run all unit tests
npm run test:all

# run tests for a specific project
npx nx run @app/user-service:test

# run only affected tests (based on git changes)
npm run affected:test
```

## Services

Each service has its own README with setup instructions, environment variables, and API docs.

| Service | Status | Path |
|---|---|---|
| User service | ✅ Done | [`services/user-service`](./services/user-service) |
| Catalog service | ✅ Done | [`services/catalog-service`](./services/catalog-service) |
| Cart service | ✅ Done | [`services/cart-service`](./services/cart-service) |
| Order service | 📋 Planned | — |
| Payment service | 📋 Planned | — |
| Notification service | 📋 Planned | — |
| API Gateway | 📋 Planned | — |

## Apps

| App | Status | Path |
|---|---|---|
| Admin dashboard | 🚧 In progress | [`apps/admin`](./apps/admin) |
| Storefront | 📋 Planned | — |

## Progress

Track development progress on the [GitHub Project board](https://github.com/users/vchopDev/projects/1).

## License

MIT