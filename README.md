# Auto Code Redeemer v2

Node.js app that scrapes Hoyoverse promo codes and redeems them automatically via `puppeteer-core` + Chrome.

Supported games: **Genshin Impact**, **Honkai: Star Rail** (add more under `src/games/`).

Game credentials and schedules are **not** stored in `.env` — they are entered via CLI or Telegram prompts at runtime.

---

## Commands

```bash
npm run dev            # Local dev — interactive CLI + scheduler (--cli)
npm start              # Production — build, then scheduler + Telegram (--server)
npm run build          # Compile TypeScript → dist/
npm run typecheck      # Type-check without emit
```

---

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run dev
```

Use the menu: **Run now**, **Schedule**, **List**, **Cancel**, **History**, **Exit**.

Scheduled tasks fire while the process is running (`npm run dev` or `npm start`).

---

## Production (Telegram)

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. Add to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_ENABLED=true
   ```
3. Run `npm start` and send `/start` to your bot in Telegram.

| `.env` | Effect |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` set | Bot enabled (default) |
| `TELEGRAM_ENABLED=false` | Disable bot; scheduler-only |

Same menu as CLI: run now, schedule, list, cancel, history. Scheduled runs notify the Telegram chat when `telegramChatId` is stored in task metadata.

---

## Docker deployment

```bash
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN and Docker paths (see .env.example prod notes)

cd deploy
docker compose up --build
```

- `docker-compose.yml` loads `../.env` from the repo root.
- Container runs `npm start` (build + server; scheduler + Telegram if configured).
- Mount `/data` for SQLite (`redeemer.db`), per-game `codes.json`, and Chrome profile.

---

## Architecture

All input sources produce the same `RedeemTask` and run through one pipeline. The redeem workflow does not know or care how the task was triggered.

```text
┌──────────────────────────────────────────────────────────┐
│  INPUT ADAPTERS                                          │
│  CLI (dev)  │  Telegram (prod)  │  Scheduler (trigger)   │
└─────────────┴───────────────────┴────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  TaskFactory           │
                 │  validates → RedeemTask│
                 └───────────┬────────────┘
                             │
                             ▼
                 ┌────────────────────────┐
                 │  runTask / Workflow    │
                 │  scrape → redeem       │
                 └────────────────────────┘
```

**Design rule:** Adapters only collect input and display output. All redeem logic lives in `application/redeemWorkflow.ts`.

`RedeemTask.source`: `"cli"` | `"telegram"` | `"scheduler"`.

### Pipeline

```text
Adapter → TaskFactory.createRedeemTask → runTask → redeemWorkflow
```

### Folder structure

```text
src/
├── index.ts                 # bootstrap — dev CLI or production server
├── config/                  # appConfig, env loading, Chrome paths
├── domain/                  # RedeemTask, ScheduledTask, RunResult, errors
├── application/             # taskFactory, taskExecutor, redeemWorkflow, scrapePolicy
├── scheduling/              # SchedulerRunner, scheduleSpec, nextRunAt
├── infrastructure/storage/  # SQLite task store, run history
├── storage/                 # per-game codes.json
├── adapters/
│   ├── cli/                 # terminal UI (inquirer)
│   ├── telegram/          # grammY bot
│   ├── server/              # production bootstrap
│   ├── ports/               # PromptPort, TaskInputAdapter
│   └── shared/              # menu, flows, collectors (CLI + Telegram)
├── games/<gameId>/          # scraper + redeemer plug-ins
├── browser/                 # Puppeteer / Chrome lifecycle
└── services/                # scrapeService, redemptionService
```

### `adapters/ports/`

- **`PromptPort`** — choice, question, yes/no, username, password (CLI = inquirer, Telegram = messages/buttons)
- **`TaskInputAdapter`** — `start()` / `stop()` for long-running inputs (Telegram bot)

### `adapters/server/`

Production entry (`runServerApp`): starts scheduler, starts Telegram when configured, registers shutdown hooks.

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
| `CODE_STORE_BASE_PATH` | Base dir for per-game `codes.json` |
| `DATABASE_URL` | `file:...` (SQLite) or `json:...` (fallback) |
| `SCHEDULER_POLL_INTERVAL_MS` | Scheduler poll interval (default 60000) |
| `CHROME_*`, `HEADLESS` | Browser launch |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_ENABLED` | `false` to disable bot while keeping token |

See `.env.example` for per-variable **dev vs prod** notes.

Task data (game, username, password, server, schedule) lives on `RedeemTask` / SQLite rows — **not** in `.env`.

---

## Scrape policy

Policy is on the task, not on a “manual vs cron” mode:

| Source | Typical policy |
|--------|----------------|
| Run now + user says yes | `{ type: "always" }` |
| Run now + user says no | `{ type: "never" }` |
| Scheduled task | `{ type: "ifNotScrapedToday" }` |

---

## Adding a new game

1. Add id to `GameId` in `src/config/constants.ts`
2. Create `src/games/<gameId>/` — `index.ts`, `config.ts`, `scraper.ts`, `redeemer.ts`
3. Register in `src/games/registry.ts`

Reuse `src/games/hoyoverse/parseRedeemMessage.ts` for Hoyoverse gift pages.

---

## Future (not implemented)

| Feature | Description |
|---------|-------------|
| REST API | `POST /api/v1/tasks/run`, schedule, list, cancel, run history |
| Discord bot | Same `RedeemTask` pipeline via adapter |
| Web dashboard | Browser UI for tasks and history |
| Email reporting | Post-run summary via `WorkflowEvent` hook |
| Integration tests | CLI run-now and schedule → scheduler → workflow |
| Azure deployment | Headless verify in container, VM/Container Apps, instance volumes |

Implementation tracking: **[PLAN.md](./PLAN.md)**. Contributor rules: **[AGENTS.md](./AGENTS.md)**.

---

## Stack

- Node.js 20+, TypeScript (ESM, `NodeNext`)
- `puppeteer-core`, `better-sqlite3`, `grammy`, `zod`, `@inquirer/prompts`
