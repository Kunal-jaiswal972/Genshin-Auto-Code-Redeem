# Auto Code Redeemer v2

Node.js app that scrapes Hoyoverse promo codes and redeems them automatically via `puppeteer-core` + Chrome.

Supported games: **Genshin Impact**, **Honkai: Star Rail** (add more under `src/games/`).

Game credentials and schedules are **not** stored in `.env` — they are entered via enabled input adapters at runtime.

---

## Commands

```bash
npm run dev            # tsx (local development)
npm start              # build + node (production)
npm run build          # Compile TypeScript → dist/
npm run typecheck      # Type-check without emit
```

Both `dev` and `start` run the **same application** (`runApplication`): scheduler plus every adapter enabled in `.env`. The only difference is `dev` uses `tsx` without a build step; `start` compiles first.

---

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run dev
```

Ensure `.env` has `CLI_ADAPTER_ENABLED=true` (default). Use the menu: **Run now**, **Schedule**, **List**, **Cancel**, **History**, **Exit**.

Scheduled tasks fire while the process is running.

---

## Input adapters

Adapters are registered in `src/adapters/registry/adapterModules.ts`. Enable each via `.env`:

| Variable | Adapter | Lifecycle |
|----------|---------|-----------|
| `CLI_ADAPTER_ENABLED=true` | Terminal menu | Foreground (blocks until Exit) |
| `TELEGRAM_ENABLED=true` + `TELEGRAM_BOT_TOKEN` | Telegram bot | Background (polling) |

With both enabled, Telegram runs in the background while the CLI menu runs in the foreground.

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. Add to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_ENABLED=true
   ```
3. Run `npm run dev` or `npm start` and send `/start` to your bot.

Scheduled runs notify the Telegram chat when `telegramChatId` is stored in task metadata.

### Production (Docker)

```bash
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN; set CLI_ADAPTER_ENABLED=false for headless containers

cd deploy
docker compose up --build -d
```

**Wipe all persisted data and start fresh** (SQLite DB, `codes.json`, Chrome profile under `/data`):

```bash
cd deploy
docker compose down -v && docker compose up --build -d
```

`-v` removes the `redeemer-data` volume. Your `.env` on the host is **not** deleted. Scheduled tasks, run history, scraped codes, and the Hoyoverse login session in the Chrome profile are erased.

From the repo root (same effect):

```bash
npm run docker:reset
```

---

## Architecture

All input sources produce the same `RedeemTask` and run through one pipeline.

```text
┌──────────────────────────────────────────────────────────┐
│  INPUT ADAPTERS (registry)                               │
│  CLI  │  Telegram  │  (future: Discord, HTTP API, …)     │
└─────────────┴────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  TaskFactory           │
                 └───────────┬────────────┘
                             ▼
                 ┌────────────────────────┐
                 │  runRedeemTask         │
                 │  executeRedeemRun      │
                 └────────────────────────┘
```

**Design rule:** Adapters only collect input and display output. All redeem logic lives in `application/executeRedeemRun.ts`.

`RedeemTask.source`: `"cli"` | `"telegram"` | `"scheduler"`.

### Folder structure

```text
src/
├── index.ts                      # bootstrap → runApplication()
├── adapters/
│   ├── registry/                 # adapterModules.ts, runApplication.ts
│   ├── cli/                      # CLI adapter module + Clack ports
│   ├── telegram/                 # Telegram adapter module + grammY
│   ├── contracts/                # PromptPort, TaskInputAdapter, …
│   └── shared/                   # mainMenu, flows, prompts, formatters
├── application/                  # executeRedeemRun, runRedeemTask, queries
├── scheduling/                   # SchedulerRunner, schedule drivers
├── infrastructure/storage/       # SQLite, code store
├── games/<gameId>/               # scraper + redeemer plug-ins
└── browser/                      # Puppeteer lifecycle
```

Contributor rules: **[AGENTS.md](./AGENTS.md)**. Implementation tracking: **[PLAN.md](./PLAN.md)**.

---

## Adding a new input adapter

1. Create `src/adapters/<name>/<name>AdapterModule.ts` implementing `AdapterModule`:
   - `isEnabled(appConfig)` — read a new `.env` flag from `appConfig.ts`
   - `lifecycle`: `"background"` (Discord, HTTP) or `"foreground"` (CLI)
   - `create()` — return `{ adapter: TaskInputAdapter, scheduledRunNotifier? }`
2. Append the module to `src/adapters/registry/adapterModules.ts`
3. Add env vars to `appConfig.ts`, `.env.example`, and this README

Shared menu flows (`runMainMenu`, `runNowMenuFlow`, …) work for any adapter that implements `PromptPort` + `DisplayPresenter`.

### Future HTTP API adapter (not implemented)

There is **no HTTP server** in this repo today. To add a REST API later:

1. Create `src/adapters/http/httpAdapterModule.ts` with `lifecycle: "background"`
2. Implement `TaskInputAdapter.start()` to bind an HTTP server (Express/Fastify) and return without blocking
3. Add thin routes that call `application/` services directly (`runRedeemTask`, `scheduledTaskQueries`, …) — most endpoints do **not** need `PromptPort`
4. Add `API_ENABLED`, `API_PORT`, and auth env vars to `appConfig.ts`
5. Register `httpAdapterModule` in `adapterModules.ts`

Optional: WebSocket + `PromptPort` for interactive API sessions.

### Future Discord adapter

Same pattern as Telegram: `discordAdapterModule.ts`, `DiscordPromptPort`, `ScheduledRunNotifier` for `discordChannelId` metadata, register in `adapterModules.ts`.

---

## Storage

| Data | Location |
|------|----------|
| Scraped codes + redeem status | `<CODE_STORE_BASE_PATH>/<gameId>/codes.json` |
| Scheduled tasks + run history | SQLite: `DATABASE_URL=file:.../redeemer.db` |
| Chrome / Hoyoverse session | `CHROME_USER_DATA_DIR` |

**JSON fallback:** `DATABASE_URL=json:./path/scheduled-tasks.json` — schedules only; **no run history**.

---

## Environment

Copy `.env.example` → `.env`. Application config only — no game credentials.

| Variable | Purpose |
|----------|---------|
| `CLI_ADAPTER_ENABLED` | Terminal menu (`true` / `false`, default `true`) |
| `CODE_STORE_BASE_PATH` | Base dir for per-game `codes.json` |
| `DATABASE_URL` | `file:...` (SQLite) or `json:...` (fallback) |
| `SCHEDULER_POLL_INTERVAL_MS` | Scheduler poll interval (default 60000) |
| `CHROME_*`, `HEADLESS` | Browser launch |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_ENABLED` | `false` to disable bot while keeping token |

---

## Scrape policy

| Source | Typical policy |
|--------|----------------|
| Run now + user says yes | `{ type: "always" }` |
| Run now + user says no | `{ type: "never" }` |
| Scheduled task | `{ type: "ifNotScrapedToday" }` |

---

## Adding a new game

1. Add id to `GameId` in `src/config/constants.ts`
2. Create `src/games/<gameId>/` — `genshinModule.ts`, `config.ts`, `scraper.ts`, `redeemer.ts`
3. Register in `src/games/registry.ts`

---

## Stack

- Node.js 20+, TypeScript (ESM, `NodeNext`)
- `puppeteer-core`, `better-sqlite3`, `grammy`, `zod`, `@clack/prompts`
