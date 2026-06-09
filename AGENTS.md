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
- Keep adapters **thin**: collect input, call `TaskFactory` / `runTask` / scheduler, display output
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
adapters (cli | telegram | server) → TaskFactory → runTask → redeemWorkflow
scheduling/SchedulerRunner triggers runTask for due ScheduledTasks
```

`RedeemTask.source`: `"cli"` | `"telegram"` | `"scheduler"`.

---

## File structure

```text
src/
├── adapters/cli/          Terminal UI
├── adapters/telegram/     grammY bot
├── adapters/server/       Production bootstrap (scheduler + adapters)
├── adapters/ports/        PromptPort, TaskInputAdapter
├── adapters/shared/       Menu, flows, collectors (shared by CLI + Telegram)
├── application/           taskFactory, taskExecutor, redeemWorkflow, scrapePolicy
├── domain/                task, result, errors
├── scheduling/            SchedulerRunner, scheduleSpec
├── infrastructure/storage/ SQLite task + run history stores
├── storage/               codes.json per game
├── games/<gameId>/        plug-in scraper + redeemer
├── config/                appConfig (infra env only)
└── browser/               Puppeteer lifecycle
```

New input adapters go under `src/adapters/` and implement `PromptPort` or JSON → `TaskFactory`.

---

## Commands

```bash
npm run dev      # CLI + scheduler (--cli)
npm start        # build + production server (--server)
npm run build && npm run typecheck
```
