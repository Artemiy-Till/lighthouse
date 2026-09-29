# Deploy to Yandex Cloud

The deployment runs the web app, API, and PostgreSQL on one Compute Cloud VM with Docker Compose. Caddy provides HTTPS for the app domain. Experience photos are stored in Yandex Object Storage.

## Requirements

- A Yandex Cloud folder with billing enabled.
- A domain you control, or a temporary `sslip.io` hostname based on the VM IP.
- Docker Engine with Compose v2 on the VM.
- A Yandex Object Storage bucket and static access key with permission to write objects.
- The MAX bot token.

## Configure

1. Copy `deploy/yandex/env.example` to `.env.yandex` in the repository root.
2. Set `APP_DOMAIN` and `CORS_ORIGINS` to the same HTTPS origin.
3. Set a long random `POSTGRES_PASSWORD`, the token of the bot that opens the mini app in `MAX_BOT_TOKEN`, its username without `@` in `MAX_BOT_USERNAME`, and a random `MAX_WEBHOOK_SECRET`.
4. Create a private Object Storage bucket and a static access key limited to that bucket. The app serves photo objects through its API; it does not make the bucket public.
5. Point the domain's `A` record to the VM's public IP. Allow DNS to propagate before the first Compose startup so Caddy can issue its certificate.

If you do not have a domain, use `<VM-IP-with-dashes>.sslip.io` for the initial deployment, e.g. `203-0-113-10.sslip.io`. This provides a temporary HTTPS hostname without owning a domain; replace it with a domain you control for a long-lived public launch.

The environment file is ignored by Git. Do not put credentials in `VITE_*` variables.

## Deploy

From the repository root on the VM:

```bash
docker compose --env-file .env.yandex -f deploy/yandex/docker-compose.yml up -d --build
```

The API container applies Prisma migrations before starting. PostgreSQL data persists in the `postgres-data` Docker volume. Check services and health with:

```bash
docker compose --env-file .env.yandex -f deploy/yandex/docker-compose.yml ps
curl --fail https://$APP_DOMAIN/api/v1/health
```

In the MAX partner portal, set the mini app URL for that same bot to `https://<APP_DOMAIN>`. Subscribe the bot to `bot_started` and `message_created` events at `https://<APP_DOMAIN>/api/v1/integrations/max/webhook`, using `MAX_WEBHOOK_SECRET` as the subscription secret. The public endpoint `/api/v1/integrations/max/status` reports which bot token the API currently uses without exposing it.

The VM is a single host: configure and test database backups before treating it as the only copy of production data. Compute Cloud charges for running VM resources, disk, and public IP; Object Storage has monthly free usage limits, then charges for excess usage.

Allow inbound TCP ports 80 and 443 from the internet. Allow SSH on port 22 only from the administrator's current public IP (`/32`) and use SSH keys; do not expose PostgreSQL or the API port publicly.
