# ADR-0001: Start as a TypeScript modular monolith

- Status: accepted
- Date: 2026-09-17

## Context

The product must reach an MVP quickly while retaining clear boundaries for a future marketplace. Its early traffic and organizational constraints do not justify distributed systems.

## Decision

Use a pnpm monorepo with a React/Vite Mini App, a NestJS/Fastify API and PostgreSQL managed through Prisma migrations. Expose a versioned REST API documented through OpenAPI. Keep MAX and future payment, notification and storage integrations behind adapters.

## Consequences

- Local development and transactional business rules remain simple.
- Frontend and backend use strict TypeScript but do not share domain entities.
- A module can be extracted later if measurements and ownership boundaries justify it.
- Redis, message brokers, Kubernetes and dedicated search infrastructure are deferred.
