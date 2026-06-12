FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.typecheck.json ./
COPY src ./src

RUN npm run build

FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
  HEADLESS=true \
  CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
  CODE_STORE_BASE_PATH=/data/codes \
  DATABASE_URL=file:/data/redeemer.db

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.typecheck.json ./
COPY src ./src
COPY --from=build /app/dist ./dist

RUN mkdir -p /data/codes /data/chrome

VOLUME ["/data"]

CMD ["npm", "start"]
