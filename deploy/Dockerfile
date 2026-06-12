FROM node:20-bookworm-slim AS build

WORKDIR /app

# better-sqlite3 native addon — no prebuild on slim image without these
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.typecheck.json ./
COPY src ./src

RUN npm run build \
  && npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium xvfb x11vnc \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
  HEADLESS=true \
  CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
  CODE_STORE_BASE_PATH=/data/codes \
  DATABASE_URL=file:/data/redeemer.db \
  SCHEDULER_TIMEZONE=Asia/Kolkata

COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh \
  && mkdir -p /data/codes /data/chrome /data/debug

VOLUME ["/data"]

ENTRYPOINT ["/docker-entrypoint.sh"]
