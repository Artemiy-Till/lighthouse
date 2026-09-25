# Architecture overview

## System shape

The MVP is a modular monolith with a separately built web client:

1. The React application runs inside the MAX WebView.
2. The web application talks to a versioned REST API under `/api/v1`.
3. The NestJS API owns authentication, authorization and all business decisions.
4. PostgreSQL is the source of truth.
5. Images will use an S3-compatible storage adapter when the catalog slice is implemented.

Web and API should share one public origin in production. This reduces WebView cookie and CORS risk. Local development uses the Vite `/api` proxy.

## Trust boundaries

- Browser and WebView data are untrusted.
- `window.WebApp.initDataUnsafe` must never authorize a request.
- Raw `window.WebApp.initData` will be validated server-side using the documented MAX signature algorithm, freshness checks and replay protection.
- The MAX bot token and future provider secrets exist only in server environment variables.
- Prices, availability and permissions will be calculated on the server.
- Structured logs redact authorization and cookie headers.

## Module boundaries

Backend modules will be added by product slice, for example `identity`, `catalog`, `availability` and `bookings`. Modules communicate through explicit application interfaces and share the same database transaction boundary while the product remains a monolith.

External systems are isolated behind adapters. The frontend already exposes a small MAX platform adapter with a safe browser fallback; it does not invent unsupported MAX APIs.

## Data conventions

- IDs: UUIDv7 or another time-sortable opaque identifier selected with the first domain model.
- Timestamps: PostgreSQL `timestamptz`, stored in UTC.
- Money: integer minor units plus ISO 4217 currency; never floating point.
- Referential integrity: foreign keys and explicit delete behavior.
- Schema changes: committed forward migrations; destructive migrations require a rollout plan.

## Operations

- CI runs formatting, lint, type checks, unit tests and production builds.
- `/api/v1/health` is a liveness endpoint. Database readiness will be added when the persistence module is introduced.
- Production logs are structured JSON.
- Production delivery uses immutable build artifacts and applies migrations before traffic is shifted.
