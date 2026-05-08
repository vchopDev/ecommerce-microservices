# Scalable E-Commerce Platform

A scalable e-commerce backend built with a microservices architecture using NestJS, TypeScript, and Docker. Includes a React admin dashboard for product and category management.

> Part of the [Backend Developer Projects](https://roadmap.sh/projects/scalable-ecommerce-platform) path on roadmap.sh — built as a learning project and portfolio piece.

## Architecture

Multiple independent services communicate via REST (synchronous) and RabbitMQ (asynchronous events).

```
Clients (web / mobile / admin)
        │
   API Gateway (planned)
        │
  ┌─────┴──────────────────────────────────────┐
  │         │         │         │              │
Users   Catalog    Cart     Orders        Payments
  │         │                  │              │
  │         └──────────────────┘              │
  │              RabbitMQ events              │
  └───────────────────────────────────────────┘
                                         Notifications
                                       (planned, via events)
```

**Event flow:**
- `order.placed` → catalog-service decrements stock → emits `product.out.of.stock`
- `product.out.of.stock` → cart-service flags affected cart items
- `product.price.changed` → cart-service updates price snapshot and flags affected cart items

## Tech Stack

### Backend
- **Framework**: NestJS with Fastify adapter
- **Language**: TypeScript
- **Message bus**: RabbitMQ (Docker locally, CloudAMQP in production)
- **Databases**: PostgreSQL (users, orders) · MongoDB (catalog) · Redis (cart)
- **ORM**: Prisma 7 (PostgreSQL services) · Mongoose (catalog)
- **Containerisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monorepo**: Nx + npm workspaces

### Frontend
- **Admin dashboard**: React 18 + Vite + Tailwind CSS v4 + shadcn/ui
- **Storefront**: Next.js (planned)

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose
- npm 10+

### Environment Setup

Each service has a `.env.example` file. Copy and fill in your values:

```bash
cp services/user-service/.env.example services/user-service/.env
cp services/catalog-service/.env.example services/catalog-service/.env
cp services/cart-service/.env.example services/cart-service/.env
cp services/order-service/.env.example services/order-service/.env
cp apps/admin/.env.example apps/admin/.env
```

### Docker

```bash
# Start dev databases + RabbitMQ
docker compose up -d

# Start test databases + RabbitMQ
docker compose -f docker-compose.test.yml up -d

# Stop all
docker compose down
docker compose -f docker-compose.test.yml down
```

**Dev infrastructure:**

| Service | Port |
|---|---|
| PostgreSQL (user-service) | 5432 |
| PostgreSQL (order-service) | 5434 |
| MongoDB (catalog-service) | 27017 |
| Redis (cart-service) | 6379 |
| RabbitMQ AMQP | 5672 |
| RabbitMQ Management UI | 15672 |

### Running the Project

```bash
# Install all dependencies from root
npm install

# Start all services + admin dashboard
npm run start:all
```

Services available at:

| Service | URL |
|---|---|
| user-service | http://127.0.0.1:3000 |
| catalog-service | http://127.0.0.1:3002 |
| cart-service | http://127.0.0.1:3003 |
| order-service | http://127.0.0.1:3004 |
| admin dashboard | http://127.0.0.1:5173 |
| RabbitMQ UI | http://127.0.0.1:15672 |

---

## Build

```bash
# Build all projects
npm run build:all

# Build a specific service
npx nx run @app/user-service:build
npx nx run @app/order-service:build
```

---

## Test

```bash
# Run all unit tests
npm run test:all

# Run all unit tests (per service)
npm run test:unit:all

# Run all E2E tests (requires test DBs running)
npm run test:e2e:all

# Run tests for a specific service
npx nx run @app/user-service:test

# Run only affected tests (based on git changes)
npm run affected:test
```

**Test infrastructure ports:**

| Service | Port |
|---|---|
| PostgreSQL test (user-service) | 5433 |
| PostgreSQL test (order-service) | 5435 |
| MongoDB test (catalog-service) | 27018 |
| Redis test (cart-service) | 6380 |
| RabbitMQ test AMQP | 5673 |
| RabbitMQ test Management UI | 15673 |

---

## Services

Each service owns its own database, has JWT-based auth, and is independently deployable.

| Service | Status | Port | Database | Path |
|---|---|---|---|---|
| user-service | ✅ Done | 3000 | PostgreSQL | [`services/user-service`](./services/user-service) |
| catalog-service | ✅ Done | 3002 | MongoDB | [`services/catalog-service`](./services/catalog-service) |
| cart-service | ✅ Done | 3003 | Redis | [`services/cart-service`](./services/cart-service) |
| order-service | ✅ Done | 3004 | PostgreSQL | [`services/order-service`](./services/order-service) |
| payment-service | 📋 Planned | — | — | — |
| notification-service | 📋 Planned | — | — | — |
| API Gateway | 📋 Planned | — | — | — |

---

## Apps

| App | Status | Path |
|---|---|---|
| Admin dashboard | ✅ Done | [`apps/admin`](./apps/admin) |
| Storefront | 📋 Planned | — |

---

## Key Architectural Decisions

1. **Database per service** — each service owns its data, no shared databases
2. **Polyglot persistence** — PostgreSQL for relational data, MongoDB for flexible product schemas, Redis for ephemeral cart data
3. **JWT in payload** — `role` field included so services can do RBAC without calling user-service
4. **Service-to-service JWT** — order-service mints short-lived (30s) JWTs to authenticate against cart-service and catalog-service
5. **Abstract client interfaces** — `CartClient`, `CatalogClient` interfaces decouple HTTP calls from business logic, swappable for RabbitMQ consumers later
6. **Price snapshot pattern** — cart stores product price at add time; re-validated hard at checkout by order-service
7. **Cart item flagging** — `product.out.of.stock` and `product.price.changed` events flag cart items rather than removing them silently; frontend shows warnings
8. **RabbitMQ topic exchange** — single `ecommerce` exchange with topic routing keys (`order.placed`, `product.out.of.stock`, `product.price.changed`)
9. **Prisma 7 custom output** — each PostgreSQL service generates its Prisma client to `src/generated/prisma` to avoid monorepo conflicts
10. **No noise on the queue** — `product.price.changed` only published when price value actually changes

---

## Progress

Track development on the [GitHub Project board](https://github.com/users/vchopDev/projects/1).

---

## License

MIT
