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
cd services/user-service
npm install
npm run start:dev
```

## Services

Each service has its own README with setup instructions, environment variables, and API docs.

| Service | Path |
|---|---|
| API Gateway | [`services/api-gateway`](./services/api-gateway) |
| User service | [`services/user-service`](./services/user-service) |
| Catalog service | [`services/catalog-service`](./services/catalog-service) |
| Cart service | [`services/cart-service`](./services/cart-service) |
| Order service | [`services/order-service`](./services/order-service) |
| Payment service | [`services/payment-service`](./services/payment-service) |
| Notification service | [`services/notification-service`](./services/notification-service) |

## Progress

Track development progress on the [GitHub Project board](../../projects).

## License

MIT