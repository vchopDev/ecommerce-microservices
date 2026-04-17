# E-commerce Microservices Platform

A scalable e-commerce backend built with a microservices architecture using NestJS, TypeScript, and Docker. Built as a learning project and portfolio piece.

## Tech stack

- **Framework**: NestJS with Fastify adapter
- **Language**: TypeScript
- **Message bus**: RabbitMQ
- **Containerisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Services

| Service | Description | Database | Port |
|---|---|---|---|
| `user-service` | Registration, authentication, profiles | PostgreSQL | 3001 |
| `catalog-service` | Products, categories, inventory | MongoDB | 3002 |
| `cart-service` | Shopping cart management | Redis | 3003 |
| `order-service` | Order placement and tracking | PostgreSQL | 3004 |
| `payment-service` | Payment processing via Stripe | PostgreSQL | 3005 |
| `notification-service` | Email and SMS notifications | — | 3006 |
| `api-gateway` | Single entry point, JWT validation, routing | — | 3000 |

## Packages

| Package | Description |
|---|---|
| `@app/shared-types` | Shared TypeScript interfaces and event contracts |
| `@app/logger` | Structured logging wrapper (Pino) |

## Architecture overview

```
Clients (web / mobile)
        │
   API Gateway :3000
        │
  ┌─────┴──────────────────────────────┐
  │                                    │
User   Catalog   Cart   Orders   Payments   Notifications
  │
PostgreSQL  MongoDB  Redis  RabbitMQ (message bus)
```

All services communicate synchronously via REST through the API Gateway. Async events (order placed, payment confirmed) travel through RabbitMQ.

## Getting started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm 10+

### Run infrastructure

Starts PostgreSQL, MongoDB, Redis, and RabbitMQ locally:

```bash
docker compose up -d
```

RabbitMQ management UI is available at `http://localhost:15672` (user: `app`, password: `secret`).

### Run a service in development

```bash
cd services/user-service
npm install
npm run start:dev
```

### Run all services

```bash
npm run start:all --workspaces
```

## Project structure

```
ecommerce-microservices/
├── services/
│   ├── user-service/
│   ├── catalog-service/
│   ├── cart-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── api-gateway/
├── packages/
│   ├── shared-types/
│   └── logger/
├── .github/
│   └── workflows/
├── docker-compose.yml
└── README.md
```

## Development phases

- [x] Phase 1 — Monorepo setup, shared packages, Docker Compose
- [ ] Phase 2 — User service (auth, JWT, PostgreSQL)
- [ ] Phase 3 — Catalog service + Cart service
- [ ] Phase 4 — Order service + Payment service (Stripe)
- [ ] Phase 5 — Notification service (SendGrid + Twilio)
- [ ] Phase 6 — API Gateway
- [ ] Phase 7 — Observability (ELK, Prometheus, Grafana)
- [ ] Phase 8 — CI/CD (GitHub Actions)

## License

MIT