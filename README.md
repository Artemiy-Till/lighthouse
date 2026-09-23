# MAX Travel Marketplace

Production-oriented foundation for a mobile-first marketplace of tours and local experiences inside MAX.

The first marketplace vertical slice includes verified MAX profiles, professional
guide accounts and globally published excursions backed by PostgreSQL.

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

The browser development fallback never impersonates a MAX user. Authentication
accepts only raw `window.WebApp.initData`, validates its signature and freshness
on the backend, and then returns the verified public profile.

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

- `DATABASE_URL`: PostgreSQL connection string. Required for professional guide
  accounts and global excursion publishing. The rest of the prototype keeps a
  read-only static fallback when the database is not configured.
- `PORT`: API port, defaults to `3000`.
- `CORS_ORIGINS`: comma-separated development origins. Production should prefer a same-origin deployment.
- `LOG_LEVEL`: structured API log level.
- `MAX_BOT_TOKEN`: server-only MAX bot token; never expose it to the frontend.
- `MAX_WEBHOOK_URL`: public HTTPS endpoint used for automatic MAX webhook
  registration.
- `MAX_WEBHOOK_SECRET`: optional webhook secret. When omitted, the API derives
  a stable secret from `MAX_BOT_TOKEN` without exposing it.
- `MAX_API_BASE_URL`: MAX API origin; defaults to `https://platform-api2.max.ru`.
- `MAX_API_TIMEOUT_MS`: timeout for outgoing MAX API calls.
- `VITE_API_BASE_URL`: public API origin used by the frontend. This value is not
  a secret.

## Prototype deployment

The current frontend prototype can be deployed to Vercel directly from this
repository. The `apps/web/vercel.json` file configures the Vite build and the
single-page application fallback required for direct links such as `/catalog`
and `/experiences/:id`.

1. Import the GitHub repository into Vercel.
2. Select `apps/web` as the Vercel Root Directory; the build and output settings
   are read from `apps/web/vercel.json`.
3. Deploy and copy the generated `https://...vercel.app` URL.
4. After the MAX bot passes moderation, open its settings on the MAX partner
   platform and paste that HTTPS URL into the mini-app URL field.

Never add `MAX_BOT_TOKEN` to Vercel variables exposed to the frontend. The
frontend sends signed launch data to the API and never receives the bot token.

### API deployment

Create a second Vercel project from the same GitHub repository and select
`apps/api` as its Root Directory. Vercel detects the standard NestJS
`src/main.ts` entrypoint automatically, so do not configure a build command or
an output directory for this project.

Add the following server-side environment variables to the API project:

- `NODE_ENV=production`
- `CORS_ORIGINS=https://lighthouse-api-one.vercel.app`
- `MAX_BOT_TOKEN`: a newly issued bot token
- `MAX_WEBHOOK_URL=https://YOUR_API_HOST/api/v1/integrations/max/webhook`
- `MAX_WEBHOOK_SECRET`: optional; leave unset to derive it from the bot token
- `DATABASE_URL`: PostgreSQL connection string supplied by the database provider

After connecting PostgreSQL, apply the committed schema once from a trusted
terminal with access to the production `DATABASE_URL`:

```bash
pnpm db:migrate:deploy
```

Professional endpoints authenticate every write with signed MAX launch data.
The bot token and database URL remain server-only.

After deployment, verify `/api/v1/health` and
`/api/v1/integrations/max/status`. The status response exposes only the public
bot identity and never returns the token.

On startup, the API checks the bot's MAX subscriptions and registers
`MAX_WEBHOOK_URL` for `message_chat_created` automatically when it is missing.
No manual API request is required. The tour-chat table is also created lazily
before its first use, while the committed migration remains the canonical
schema for new environments.

When the first booking for a schedule slot is created, the guide receives a
MAX button. Pressing it creates the group chat. The webhook stores its invite
link and the bot sends that link to every confirmed guest for the same
experience, date and time. Later bookings receive the existing link
automatically.

The frontend uses `https://lighthouse-api-lwsx.vercel.app` as the current
production API fallback. Set `VITE_API_BASE_URL` on the frontend Vercel project
when the API domain changes. Inside MAX, `POST /api/v1/auth/max` verifies the
signed launch data before the profile is displayed.

## Repository layout

- `apps/web`: React MAX Mini App.
- `apps/api`: NestJS modular monolith.
- `prisma`: PostgreSQL schema and migrations.
- `docs`: architecture and decisions.
- `.github/workflows`: CI quality gates.

See [architecture overview](docs/architecture/overview.md) and [ADR-0001](docs/adr/0001-modular-monolith.md).
