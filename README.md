# MAX Travel Marketplace

Production-oriented foundation for a mobile-first marketplace of tours and local experiences inside MAX.

The repository intentionally contains no marketplace business features yet. Product capabilities are added as independently testable vertical slices.

## Requirements

- Node.js 24.15+ LTS
- pnpm 11
- Docker with Compose

## Local development

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm dev
```

- Web: `http://localhost:5173`
- API health: `http://localhost:3000/api/v1/health`
- API docs in development: `http://localhost:3000/api/docs`

The browser development fallback never impersonates a MAX user. Real authentication will accept only raw `window.WebApp.initData` and validate its signature on the backend.

## Quality checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm build
```

## Database and migrations

Prisma configuration lives in `prisma.config.ts`; the schema is in `prisma/schema.prisma` and migrations are committed under `prisma/migrations`.

```bash
pnpm db:migrate          # create/apply a development migration
pnpm db:migrate:deploy   # apply committed migrations in deployment
```

No domain tables are created until their product slice is implemented.

## Environment variables

Copy `.env.example` to `.env`. Environment files are ignored by Git.

- `DATABASE_URL`: PostgreSQL connection string.
- `PORT`: API port, defaults to `3000`.
- `CORS_ORIGINS`: comma-separated development origins. Production should prefer a same-origin deployment.
- `LOG_LEVEL`: structured API log level.
- `MAX_BOT_TOKEN`: server-only MAX bot token; never expose it to the frontend.

## Prototype deployment

The current frontend prototype can be deployed to Vercel directly from this
repository. The root `vercel.json` builds only `apps/web` and configures the
single-page application fallback required for direct links such as
`/catalog` and `/experiences/:id`.

1. Import the GitHub repository into Vercel.
2. Keep the repository root as the project root; the build and output settings
   are read from `vercel.json`.
3. Deploy and copy the generated `https://...vercel.app` URL.
4. After the MAX bot passes moderation, open its settings on the MAX partner
   platform and paste that HTTPS URL into the mini-app URL field.

This deployment publishes only the static prototype. The API, database, MAX
authentication, and bot token will be configured separately before production
use. Never add `MAX_BOT_TOKEN` to Vercel variables exposed to the frontend.

## Repository layout

- `apps/web`: React MAX Mini App.
- `apps/api`: NestJS modular monolith.
- `prisma`: PostgreSQL schema and migrations.
- `docs`: architecture and decisions.
- `.github/workflows`: CI quality gates.

See [architecture overview](docs/architecture/overview.md) and [ADR-0001](docs/adr/0001-modular-monolith.md).
