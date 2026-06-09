# Auto Code Redeemer v2 — Implementation Plan

> User docs: **[README.md](./README.md)** · Agent rules: **[AGENTS.md](./AGENTS.md)**

---

## Phases 1–6b ✅ COMPLETE

---

## Phase 7 — Event-Driven Architecture ✅ COMPLETE

### Steps

#### Step 1 — Domain + workflow ✅

- [x] Add `domain/task/`, `domain/result/`
- [x] Add `application/redeemWorkflow.ts`, `scrapePolicy.ts`, `taskExecutor.ts`
- [x] Remove `EXECUTION_MODE` from workflow layer
- [x] Delete `scrapeGate.ts`, `orchestrator.ts`

#### Step 2 — Config cleanup ✅

- [x] Split `env.ts` → `appConfig.ts` (infra only)
- [x] Remove `GAME_ID`, credentials, `EXECUTION_MODE` from app config
- [x] Delete `src/config/env.ts`, `src/types/env.ts`

#### Step 3 — CLI redesign ✅

- [x] `adapters/cli/cliApp.ts` — Run now / Schedule menu
- [x] Shared flows + collectors under `adapters/shared/`
- [x] `application/taskFactory.ts`
- [x] Delete legacy `src/cli/`, cron scripts

#### Step 4 — Scheduler ✅

- [x] `scheduleSpec.ts`, `nextRunAt.ts`, `SchedulerRunner`
- [x] Schedule flow in CLI (+ list / cancel)
- [x] `createScheduler()` + `SCHEDULER_POLL_INTERVAL_MS`

#### Step 5 — Persistence ✅

- [x] SQLite — `scheduled_tasks` + `run_history` (`DATABASE_URL=file:...`)
- [x] JSON fallback via `DATABASE_URL=json:...`
- [x] `runTask()` records history

#### Step 6 — Adapters ✅

- [x] Telegram — shared `interactiveApp` + `PromptPort`; grammY bot
- [x] `adapters/server/serverApp.ts` — `npm start`
- [x] `deploy/Dockerfile` + `docker-compose.yml`
- [x] Future: REST API, Discord, web dashboard - mentioned in README.md

#### Step 7 — Legacy purge ✅

- [x] No `orchestrator`, `EXECUTION_MODE`, `npm run cron` in `src/`
- [x] Removed API/Discord/daemon empty folders, old `src/cli/`, `src/core/`
- [x] `errors.ts` → `domain/errors.ts`
- [x] `package.json` — `dev` (CLI) + `start` (production)
- [x] Root `README.md`, slim `AGENTS.md`, `.env.example`

### Phase 7 checklist

- [x] Domain models + Zod schemas (`RedeemTask`, `ScheduleSpec`, `RunResult`)
- [x] `TaskFactory`, `TaskExecutor`, `RedeemWorkflow`
- [x] `scrapePolicy` replaces `scrapeGate`
- [x] `appConfig` replaces credential-bearing `AppEnv`
- [x] CLI menu: Run now + Schedule + list/cancel/history
- [x] `SchedulerRunner` + SQLite-backed tasks
- [x] Telegram adapter + server mode
- [x] Legacy audit passes (build + typecheck)
- [ ] Integration test: CLI run-now → workflow → result
- [ ] Integration test: CLI schedule → scheduler trigger → workflow → result

---

## Phase 8 — Pre-architecture cleanup ✅ COMPLETE

- [x] Deleted legacy `scripts/`, `server/`, `src/db/`
- [x] Removed old GitHub Actions workflow
- [x] Removed unused errors, exports, and dead code

---

## Phase 9 — Docker / Azure Deployment ⏳ IN PROGRESS

- [x] `deploy/Dockerfile`
- [x] `deploy/docker-compose.yml` (loads root `.env`)
- [x] `.env.example` — app config only
- [x] Deployment docs in root `README.md`
- [ ] Verify headless redeem in container
- [ ] Wire Azure VM / Container Apps with mounted `/data` volume
- [ ] `.gitignore`: `deploy/instances/**/.env`, `deploy/instances/**/data/`

---

## Roadmap — Input adapters


| Adapter                           | Status     |
| --------------------------------- | ---------- |
| Terminal CLI (Run now + Schedule) | ✅ Complete |
| Telegram bot                      | ✅ Complete |
| REST API                          | 🔮 Future  |
| Discord bot                       | 🔮 Future  |
| Web dashboard                     | 🔮 Future  |


---

## Future TODO

### Email reporting

- [ ] `src/infrastructure/reporting/emailReporter.ts`
- [ ] Subscribe to `WorkflowEvent` on event bus (post-run hook)

### REST API (sketch)

- [ ] `POST /api/v1/tasks/run` → `runTask`
- [ ] `POST /api/v1/tasks/schedule` → scheduler register
- [ ] `GET /api/v1/tasks/scheduled`, `DELETE /api/v1/tasks/:id`
- [ ] `GET /api/v1/tasks/:id/runs` → run history

---

## Changelog


| Date       | Phase   | Notes                                                 |
| ---------- | ------- | ----------------------------------------------------- |
| 2026-06-08 | 6       | Terminal prompts for manual scrape + credentials      |
| 2026-06-08 | 6b      | Single-instance env-only; JSON code store; no MongoDB |
| 2026-06-08 | 8       | Removed legacy folders and dead code                  |
| 2026-06-08 | 7-plan  | Event-driven architecture documented                  |
| 2026-06-08 | 7-step2 | `appConfig.ts`; deleted `env.ts` / `AppEnv`           |
| 2026-06-08 | 7-step3 | CLI adapter menu, taskFactory; removed legacy bridge  |
| 2026-06-08 | 7-step4 | SchedulerRunner + task store persistence              |
| 2026-06-09 | 7-step5 | SQLite task + run history; server mode (`--server`)   |
| 2026-06-09 | 7-step6 | Telegram adapter + Docker deploy files                |
| 2026-06-09 | 7-step7 | Legacy purge; `dev`/`start` scripts; root README      |


