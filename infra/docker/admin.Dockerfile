FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @annexevoice/admin... build

FROM caddy:2 AS runtime
COPY --from=build /app/apps/admin/dist /srv/admin
