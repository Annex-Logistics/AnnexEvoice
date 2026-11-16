FROM node:22-slim AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @annexevoice/api... build
RUN pnpm --filter @annexevoice/api deploy /out/api --prod

FROM node:22-slim AS runtime
RUN groupadd -g 10001 app && useradd -u 10001 -g 10001 -s /bin/sh app
WORKDIR /app
COPY --from=build /out/api /app
USER app
CMD ["node", "dist/src/main.js"]
