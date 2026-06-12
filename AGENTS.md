---
description: 
alwaysApply: true
---

# AGENTS.md — Auto Code Redeemer v2

Rules and structure for AI agents and contributors. User-facing docs: **[README.md](./README.md)**. Task tracking: **[PLAN.md](./PLAN.md)**.

---

## Rules (most important)

### Do

- Validate all external input with **Zod**
- Read `process.env` only in **`src/config/appConfig.ts`**
- Use **options objects** when a function has 3+ parameters
- Keep game-specific URLs/selectors in **`src/games/<gameId>/`**
- Use **`.js` extensions** in import paths (ESM + `NodeNext` — resolves to compiled output)
- Keep adapters **thin**: collect input, call `TaskFactory` / `runRedeemTask` / scheduler, display output
- Put redeem/scrape logic in **`application/`** and **`games/`**, never in adapters
- Use typed errors from **`src/domain/errors.ts`**
- Fail gracefully — guard missing data, handle loading/error/empty states in UI adapters

### Do not

- Add credentials to `.env` or JSON code store
- Put redeem/scrape logic in adapters
- Use full `puppeteer` package (use `puppeteer-core` only)
- Register games outside `src/games/registry.ts`
- Reintroduce `EXECUTION_MODE`, `GAME_ID`, or env-based credentials
- Leave legacy shims or `@deprecated` re-exports — delete replaced code in the same change
- Use `any` or non-null assertions (`!`)

---

## Architecture (summary)

```text
adapters (cli | telegram | server) → TaskFactory → runRedeemTask → executeRedeemRun
scheduling/SchedulerRunner triggers runRedeemTask for due ScheduledTasks
```

`RedeemTask.source`: `"cli"` | `"telegram"` | `"scheduler"`.

---

## File structure

```text
src/
├── adapters/registry/
│   ├── adapterModules.ts      Central registry — append new adapters here
│   ├── createEnabledAdapters.ts
│   └── runApplication.ts      Unified bootstrap (dev + prod)
├── adapters/cli/
│   ├── core/
│   │   ├── cliAdapterModule.ts   CLI adapter registration
│   │   ├── cliAdapter.ts         TaskInputAdapter implementation
│   │   └── cliPorts.ts           Re-exports shared terminal ports for CLI
│   └── lib/
│       └── prompts.ts            Clack-backed prompt helpers
├── adapters/telegram/
│   ├── core/
│   │   ├── telegramAdapterModule.ts
│   │   ├── telegramAdapter.ts       grammY bot + TaskInputAdapter
│   │   └── telegramPromptPort.ts    PromptPort + DisplayPresenter for Telegram
│   └── lib/
│       ├── telegramPromptSession.ts
│       └── telegramScheduledRunNotifier.ts
├── adapters/contracts/        PromptPort, DisplayPresenter, TaskInputAdapter, ScheduledRunNotifier
├── adapters/shared/
│   ├── terminalPorts.ts       Shared terminal PromptPort + DisplayPresenter
│   ├── mainMenu.ts            Main menu loop (run / schedule / list / cancel / history)
│   ├── scheduledRunHandler.ts Scheduler fallback: run task + display result
│   ├── schedulerOnTrigger.ts  Route scheduled runs → Telegram notify or terminal display
│   ├── displayRunResult.ts    Format + print a RunResult via PromptPort
│   ├── flows/                 runNowMenuFlow, scheduleMenuFlow
│   ├── prompts/               promptGameSelection, promptCredentials, promptSchedule, …
│   └── formatters/            formatDisplayCard, formatScheduledTask, formatRunHistory, …
├── application/
│   ├── executeRedeemRun.ts    Full run orchestration (scrape → redeem → result)
│   ├── browserRedemption.ts   Code-store + browser redeem steps
│   ├── dispatchTaskSteps.ts   Wire task → executeRedeemRun with code-store context
│   ├── runRedeemTask.ts       Adapter entry: dispatch + record run history
│   ├── taskFactory.ts         Build RedeemTask from user input
│   ├── queries/               scheduledTaskQueries, runHistoryQueries
│   └── presenters/            runResultFormatting
├── domain/                    task, result, schedule, schemas, display, errors
├── scheduling/                SchedulerRunner, drivers/, scheduleTime.ts, scheduleDisplay
├── infrastructure/storage/
│   ├── stores/                codeStore, scheduledTaskStore, runHistoryStore ports
│   ├── sqlite/                SQLite store implementations
│   └── io/                    jsonFile helpers
├── infrastructure/ui/         promptShutdown (adapter-agnostic)
├── games/<gameId>/            <gameId>Module.ts + scraper + redeemer
├── games/hoyoverse/shared/    redeemMessageParser (import file directly, no index barrel)
├── games/credentials.ts       shared server choices + credential validation
├── config/                    appConfig (infra env only)
└── browser/                   Puppeteer lifecycle
```

New input adapters: implement `AdapterModule` under `src/adapters/<name>/`, append to `adapterModules.ts`, add env flag in `appConfig.ts`. Import from concrete files; **no `index.ts` re-export barrels**.

### Runtime data paths (`src/data/` — not in git)

Created at runtime from `.env` defaults (`CODE_STORE_BASE_PATH`, `DATABASE_URL`):

| Path | Purpose |
|------|---------|
| `src/data/<gameId>/codes.json` | Scraped codes + per-code redeem status |
| `src/data/redeemer.db` | SQLite: scheduled tasks + run history |

Override via `CODE_STORE_BASE_PATH` and `DATABASE_URL` in `.env`. Docker mounts `/data` for persistence.

---

## Commands

```bash
npm run dev      # tsx, hot path for local work
npm start        # build + node dist/
npm run build && npm run typecheck
```

---

## Architecture & Refactoring Principles

These rules apply to **all** changes (including Phase 9+). Prefer extensibility over short-term convenience.

### Layering & dependency direction

```text
adapters → application → domain
              ↓              ↑
         infrastructure   (types only)
              ↓
         games / browser / config
```

- **Domain** (`domain/`) — pure types, errors, validation schemas. Must not import adapters, infrastructure, browser, games, or scheduling implementations.
- **Application** (`application/`) — use cases: workflows, policies, factories, query services. Orchestrates domain + ports; no UI or transport code.
- **Infrastructure** (`infrastructure/`) — SQLite, file I/O, external APIs. Implements repositories; does not import adapters.
- **Adapters** (`adapters/`) — thin translation: collect input, call application services, render output. **No business rules.**
- **Games** (`games/`) — plug-in scrapers/redeemers only. Register via `registry.ts`; never import adapters.

**Forbidden imports:** `browser/` → `adapters/` · `domain/` → `scheduling/` (move shared types to domain) · `adapters/` → `infrastructure/` (use application query services instead).

### Adapters stay thin

- Adapters implement **ports** (`PromptPort`, future `HttpPort`, etc.) and map to/from DTOs.
- Menu loop (`mainMenu.ts`) calls **flows**; flows call **application** functions only.
- Never call `getRunHistoryStore()`, store implementations, or `codeStore` directly from adapters — use `application/queries/` instead.
- Display formatting: build `DisplayCard` in `adapters/shared/formatters/` or application presenters; keep `PromptPort` free of concrete display types where possible.

### Composition & extensibility

- **Strategy over switch:** scheduling recurrence, scrape policy, game modules — register strategies; avoid growing `switch` statements in core runners.
- **Options objects** for 3+ parameters; **constructor/factory injection** for stores and config in application layer (enables testing).
- New input surfaces (REST, Discord, Web) add an adapter + port implementation; **do not fork** business logic.
- Name for the platform direction: **Job** (one run), **Trigger** (schedule), **Workflow** (orchestrated steps), **Repository** (persistence).

### Configuration

- Runtime/user data (credentials, schedules, per-user state) → **database**, never `.env` or `codes.json`.
- Infra only in `appConfig.ts` (paths, keys, feature flags, poll intervals).
- Game-specific constants in `games/<gameId>/`; shared enums in `domain/` or `config/constants.ts`.

### Code quality

- **Single Responsibility:** split files >200 lines or mixing UI + domain + I/O.
- **DRY schemas:** one Zod source per concept; infrastructure imports from domain, not duplicated.
- **No dead exports:** remove unused formatters, registry wrappers, no-op shims.
### Feature placement (automation platform)

| Concern | Belongs in |
|---------|------------|
| When to scrape | `application/scrapePolicy.ts` |
| Redeem orchestration | `application/executeRedeemRun.ts` |
| Browser + code-store redeem | `application/browserRedemption.ts` |
| When task runs next | `scheduling/drivers/` + `domain/schedule` types |
| What user sees | `adapters/shared/formatters/` |
| What gets stored | `infrastructure/storage/` repositories |
| Game-specific DOM | `games/<gameId>/` |

### Before Phase 9 (multi-user)

Phase 8.5 refactor is **complete** — see `PLAN.md` and `arch_audit.md`. Phase 9 may proceed.
