FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libxkbcommon0 libgbm1 \
 && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @annexevoice/worker... build
RUN pnpm --filter @annexevoice/worker deploy /out/worker --prod

FROM base AS runtime
RUN groupadd -g 10001 app && useradd -u 10001 -g 10001 -s /bin/sh app
WORKDIR /app
COPY --from=build /out/worker /app
USER app
CMD ["node", "dist/main.js"]
