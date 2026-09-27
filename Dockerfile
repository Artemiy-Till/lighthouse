FROM node:24.15-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json prisma.config.ts ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps ./apps
COPY prisma ./prisma

RUN pnpm db:generate

FROM base AS api-build

RUN pnpm --filter @marketplace/api build

FROM api-build AS api

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate:deploy && pnpm --filter @marketplace/api start"]

FROM base AS web-build

ARG VITE_API_BASE_URL=/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm --filter @marketplace/web build

FROM nginx:1.29-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
