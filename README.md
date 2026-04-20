# Scalable E-Commerce Platform

A scalable e-commerce backend built with a microservices architecture using NestJS, TypeScript, and Docker.

> Part of the [Backend Developer Projects](https://roadmap.sh/projects/scalable-ecommerce-platform) path on roadmap.sh — built as a learning project and portfolio piece.

## Architecture

Multiple independent services communicate through an API Gateway (synchronous REST) and RabbitMQ (async events).

```
Clients (web / mobile)
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

- **Framework**: NestJS with Fastify adapter
- **Language**: TypeScript
- **Message bus**: RabbitMQ
- **Databases**: PostgreSQL · MongoDB · Redis
- **Containerisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Getting started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose
- npm 10+

## Environment setup

Each service has a `.env.example` file. Copy it to `.env` and fill in your values:

```bash
cp services/user-service/.env.example services/user-service/.env
cp services/catalog-service/.env.example services/catalog-service/.env
```

## Docker

Local development only. Production uses a managed cloud database.

```bash
# start dev database
docker compose up -d

# start test database
docker compose -f docker-compose.test.yml up -d
```

### Run a service in development

```bash
# install all dependencies from root
npm install

# start all services together
npm run start:all

# or start a single service
cd services/user-service
npm run start:dev
```

**2. The services table links to services that don't exist yet** — `api-gateway`, `cart-service`, `order-service`, `payment-service`, `notification-service` will all be dead links on GitHub. Either remove them until they exist, or add a note:

```markdown
## Services

Each service has its own README with setup instructions, environment variables, and API docs.

| Service | Status | Path |
|---|---|---|
| User service | ✅ Done | [`services/user-service`](./services/user-service) |
| Catalog service | 🚧 In progress | [`services/catalog-service`](./services/catalog-service) |
| Cart service | 📋 Planned | — |
| Order service | 📋 Planned | — |
| Payment service | 📋 Planned | — |
| Notification service | 📋 Planned | — |
| API Gateway | 📋 Planned | — |
```

## Progress

Track development progress on the [GitHub Project board](../../projects).

## License

MIT