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

## Phase 8.5 — Refactor & cleanup (pre–Phase 9) ✅ COMPLETE

> **Goal:** Improve maintainability and adapter-ready architecture **without** new features. Complete before Phase 9. Full audit: `arch_audit.md`.

| Step | Summary | Risk |
|------|---------|------|
| 8.5.1 ✅ | Fix layer violations (domain, browser, adapters) | Low |
| 8.5.2 ✅ | Unify Zod schemas + move `ScheduleSpec` to domain | Low |
| 8.5.3 ✅ | Application query services (history, tasks) | Low |
| 8.5.4 ✅ | Extract shared JSON I/O utilities | Low |
| 8.5.5 ✅ | Split `genshin/redeemer.ts` | Medium |
| 8.5.6 ✅ | Scheduler strategy registry (`ScheduleDriver`) | Medium |
| 8.5.7 ✅ | Decouple `PromptPort` from `DisplayCard` | Low |
| 8.5.8 ✅ | Fold `services/` into `application/` | Low |
| 8.5.9 ✅ | Split `collectDateTime.ts`; unify weekday constants | Low |
| 8.5.10 | ~~Add unit tests~~ — skipped (not required for Phase 9) | — |
| 8.5.11 ✅ | Remove dead code; update AGENTS.md tree | Low |

**Gate:** Phase 9 may start — all required refactor steps complete.

---

## Phase 9 — Multi-user auth + unified SQLite storage ⏳ NOT STARTED

> **Goal:** One deployment serves multiple Hoyoverse accounts with **login / sign-up / guest** flows. **All app data** (users, codes, scheduled tasks, run history) lives in SQLite — no `codes.json` or JSON task-store fallback. Logged-in users get isolated data, stored credentials, and a dedicated Chrome profile (managed by the app, invisible to the user).

### Current limitation

- Codes in JSON files (`src/data/<gameId>/codes.json`) — global per game, not per account
- Tasks/history already SQLite, but codes are a separate JSON layer
- One `CHROME_USER_DATA_DIR` — switching accounts conflicts Hoyoverse session
- `RedeemTask.credentials` has username/password but no stable **user id**
- No session concept — everyone shares the same menu and data

### Startup & session UX (CLI + Telegram + future adapters)

On **every program start** (before main menu), show:

1. **Log in** — pick an existing saved account
2. **New account** — sign up (then logged in with full menu)
3. **Continue as guest** — no account persisted

| Mode | Main menu | Credentials | Tasks / history |
|------|-----------|-------------|-----------------|
| **Logged in** | Run now, Schedule, List, Cancel, History, **Account**, Exit | Auto from `users` row | Only this user's rows |
| **Guest** | **Run now only** + Exit | Prompted every run (username, password, server) | None stored |

**Logged-in user behavior**

- Full menu: **Run now**, **Schedule**, list/cancel/history, **Account**, Exit
- Run now and scheduled runs use stored credentials automatically — no re-prompt unless policy requires scrape choice (e.g. scrape yes/no on manual run)
- Scheduled task list and run history are **filtered by `user_id`**
- Scheduler triggers load that user's credentials, codes, and Chrome profile

**Guest behavior**

- **Run now** + **Exit** only — same run-now action as logged-in users, but no Schedule, List, Cancel, History, or Account
- Must enter game, username, password, and server on every run (logged-in users skip this)
- Nothing written to `users`, `scheduled_tasks`, or persistent run history tied to an account

**Account menu** (logged-in users only — not shown to guests)

- **Log out** — end session, return to startup screen (login / new account / guest)
- **Delete account** — remove user row, all `user_id`-scoped codes/tasks/history, and **delete Chrome profile folder** from disk
- **No edit** — to change game/credentials, user **deletes account** and creates a **new account** from the startup screen (top-level **New account**), not an in-place edit flow

**New account** (startup option — pick from startup gate, not from main menu while already logged in; to add another account: log out → startup → New account)

- Collect: `game_id`, `username`, `password`, `server`
- Chrome profile path is **assigned automatically** (`<CHROME_USER_DATA_DIR>/<user_id>/` or sanitized slug) — **never shown or configurable by the user**
- After sign-up, user is logged in and sees the full menu

**Menu visibility rule**

| | Run now | Schedule | List / Cancel / History | Account | Exit |
|---|:---:|:---:|:---:|:---:|:---:|
| **Logged in** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Guest** | ✅ | — | — | — | ✅ |

Both modes can **run now**. Only logged-in users get **schedule** (create/list/cancel tasks), **run history**, and **account** actions.

**No session persistence (all adapters)**

- Auth state lives **in memory only** for the lifetime of the running process
- **Exit** (main menu, `/stop`, process shutdown, adapter disconnect) **always ends the session** — no “remember me”, no saved login, no cookies/tokens on disk
- Next launch (CLI `npm run dev`, Telegram `/start`, future REST/web) **always shows the startup screen** again: Log in / New account / Guest
- **Log out** behaves the same as exit for session purposes (return to startup screen without quitting the process)
- Do **not** persist `user_id` in SQLite sessions table, env files, Telegram chat metadata, or local storage between runs
- Telegram: `/start` after exit requires login again; `/stop` clears in-memory session; no auto-resume of previous user on new `/start`

### Users table (single source of truth per account)

```text
DATABASE_URL=file:./src/data/redeemer.db   ← single SQLite file for everything

users (
  id              TEXT PRIMARY KEY,
  game_id         TEXT NOT NULL,
  username        TEXT NOT NULL,
  password        TEXT NOT NULL,        -- encrypted at rest (see security)
  server          TEXT NOT NULL,
  chrome_profile  TEXT NOT NULL,        -- absolute or relative path; app-managed
  created_at      TEXT NOT NULL,
  UNIQUE (game_id, username, server)    -- or app-defined uniqueness rule
)

codes            (user_id, game_id, code, wiki_status, redeem_status, scraped_at, …)
scheduled_tasks  (id, user_id, game_id, credentials_json, schedule_json, …)
run_history      (id, user_id, scheduled_task_id, game_id, …)
```

No `sessions` table — login state is **not** stored in the DB between process runs.

**User–code relation:** Each row in `codes` ties one user to one promo code for one game. Same code string can be `pending` for user A and `redeemed` for user B.

**Remove:** `codes.json`, `CODE_STORE_BASE_PATH` for codes, JSON `CodeStore` file implementation, `DATABASE_URL=json:...` task-store fallback (SQLite only).

### Schema strategy (testing — clean slate, no incremental migrations)

> Current environment is **test-only** — no production data to preserve. Phase 9 uses a **wipe and recreate** approach instead of numbered SQL migration files.

**Do this once when starting Phase 9 schema work**

- [ ] Delete SQLite DB file (e.g. `src/data/redeemer.db` or path from `DATABASE_URL`)
- [ ] Delete JSON code files under `src/data/**/codes.json` (if any)
- [ ] Delete test Chrome profile folders under `CHROME_USER_DATA_DIR` (optional but recommended)

**Implementation approach**

- [ ] Replace `migrations.ts` with a **single full schema** — all tables defined together: `users`, `codes`, `scheduled_tasks` (with `user_id`), `run_history` (with `user_id`), indexes
- [ ] Keep `migrateSqliteDatabase(db)` as `CREATE TABLE IF NOT EXISTS` + indexes on startup (idempotent for empty DB)
- [ ] **No** `schema_migrations` table, **no** `001_*.sql` / `002_*.sql` files, **no** import from old `codes.json` or backfill of old task rows
- [ ] Document reset in README: stop app → delete DB (+ codes JSON + chrome folders) → start app → fresh schema

**Later (post-Phase 9, when data matters):** introduce numbered migrations and `schema_migrations` before any shared/production deploy. Not in scope for this phase.

### Security principles (apply in every subtask below)

- Passwords encrypted at rest (`CREDENTIALS_ENCRYPTION_KEY`); never log passwords
- Parameterized SQL + Zod validation on all inputs
- Session in-memory only — never persisted to DB/disk between process runs
- Chrome profile paths app-assigned only; sanitized; deleted with account
- Guest least-privilege — no access to other users' data

---

### Sequential subtasks

> Work **in order**. Mark a step ✅ only after its **Verify** checks pass. Do not skip ahead — later steps depend on earlier ones.

| Step | Summary | Status |
|------|---------|--------|
| [9.1](#step-91--schema-foundation-clean-slate) | Full schema + `users` table (wipe DB first) | ⏳ |
| [9.2](#step-92--session-model-in-memory-only) | `SessionContext` (no persistence) | ⏳ |
| [9.3](#step-93--sign-up--chrome-profile) | New account + auto Chrome folder | ⏳ |
| [9.4](#step-94--startup-gate--login-cli) | Startup screen + login (CLI) | ⏳ |
| [9.5](#step-95--guest-mode-cli) | Guest menu (Run now only) | ⏳ |
| [9.6](#step-96--logged-in-run-now) | Run now with stored credentials | ⏳ |
| [9.7](#step-97--user-scoped-tasks--history) | `user_id` on tasks + history | ⏳ |
| [9.8](#step-98--sqlite-codes-per-user) | Codes in SQLite; remove JSON store | ⏳ |
| [9.9](#step-99--scheduler-per-user) | Scheduler + Chrome per user | ⏳ |
| [9.10](#step-910--account-menu) | Log out + delete account | ⏳ |
| [9.11](#step-911--telegram-parity) | Same auth flows on Telegram | ⏳ |
| [9.12](#step-912--cleanup--docs) | Remove legacy paths; docs + E2E | ⏳ |

---

#### Step 9.1 — Schema foundation (clean slate)

**Goal:** Wipe test data; define full Phase 9 schema in one place; `users` table + credential crypto.

**Build**

- [ ] **Reset:** delete existing DB file, `codes.json` files, and test Chrome profiles (manual or `npm run db:reset` script)
- [ ] Rewrite `src/infrastructure/storage/sqlite/migrations.ts` — single schema block with `users`, `scheduled_tasks` (+ `user_id`), `run_history` (+ `user_id`), `codes`, indexes (no separate migration versions)
- [ ] `UserRepository` — create, getById, listForLogin, delete
- [ ] `credentialCrypto.ts` — encrypt/decrypt password at rest; validate `CREDENTIALS_ENCRYPTION_KEY` at startup
- [ ] Zod schemas for user create/login payloads

**Verify**

- [ ] `npm run typecheck` passes
- [ ] Delete DB → start app → tables created; second start is idempotent (`CREATE IF NOT EXISTS`)
- [ ] Create user via repository; password in DB is not plain text
- [ ] List users returns labels without exposing password
- [ ] Old scheduled tasks / history / codes are **gone** after reset (expected)

**Status:** ⏳ NOT STARTED

---

#### Step 9.2 — Session model (in-memory only)

**Goal:** Single `SessionContext` used by all adapters; cleared on exit — no disk persistence.

**Build**

- [ ] `SessionContext` type: `{ kind: "guest" }` | `{ kind: "user"; userId: string }`
- [ ] `SessionManager` (or equivalent) — set/get/clear; **no** SQLite/file writes
- [ ] Wire clear on CLI Exit, log out hook, process `SIGINT`/`beforeExit`
- [ ] Document: restarting app always requires login/guest again

**Verify**

- [ ] Unit test: set user → clear → `get()` is null/empty
- [ ] No session files created under `src/data` or temp dirs during run
- [ ] After Exit and re-entering CLI, startup gate shows again (manual smoke once 9.4 exists)

**Status:** ⏳ NOT STARTED

---

#### Step 9.3 — Sign-up + Chrome profile

**Goal:** New account flow creates DB row + Chrome profile directory automatically.

**Build**

- [ ] `createChromeProfileForUser(userId)` → `path.join(CHROME_USER_DATA_DIR, userId)`; `fs.mkdir` on sign-up
- [ ] Shared `signUpFlow(port)` — game, username, password, server (reuse collectors)
- [ ] Store `chrome_profile` on user row; never prompt user for path
- [ ] On success: set `SessionContext` to logged-in user

**Verify**

- [ ] Sign up → folder exists on disk
- [ ] `users.chrome_profile` matches created path
- [ ] Duplicate (game, username, server) rejected with clear error
- [ ] User lands on full main menu after sign-up

**Status:** ⏳ NOT STARTED

---

#### Step 9.4 — Startup gate + login (CLI)

**Goal:** Every CLI start shows Login | New account | Guest before main menu.

**Build**

- [ ] `startupGateFlow(port)` — three choices; New account → `signUpFlow`; Login → user picker (game · username · server)
- [ ] Login sets `SessionContext`; no password re-entry at login (account is the identity)
- [ ] Integrate in `cliApp.ts` before `runInteractiveApp`
- [ ] Exit from main menu → process ends → next `npm run dev` shows startup gate again

**Verify**

- [ ] Cold start always shows startup gate
- [ ] Login as user A → main menu; Exit → restart → startup gate (not auto-logged-in)
- [ ] Two saved users: picker shows both; selecting one loads correct session

**Status:** ⏳ NOT STARTED

---

#### Step 9.5 — Guest mode (CLI)

**Goal:** Guest sees **Run now + Exit** only; credentials prompted every run.

**Build**

- [ ] `runInteractiveApp` accepts `SessionContext`
- [ ] Guest menu: **Run now** + Exit only — hide Schedule, List, Cancel, History, Account (logged-in keeps Run now + all schedule options)
- [ ] Guest run now: always collect game + credentials (existing collectors)
- [ ] Guest runs do not write `user_id` on tasks/history (or skip persistent history — define in 9.7)

**Verify**

- [ ] Guest cannot reach schedule/list/history menus
- [ ] Each guest run prompts credentials
- [ ] Guest Exit → restart → startup gate

**Status:** ⏳ NOT STARTED

---

#### Step 9.6 — Logged-in run now

**Goal:** Logged-in user runs without re-entering username/password/server.

**Build**

- [ ] `runNowFlow` reads credentials from `UserRepository` when `SessionContext.kind === "user"`
- [ ] Pass user's `chrome_profile` into workflow (stub OK until 9.9 fully wires launcher)
- [ ] Keep scrape yes/no prompt for manual runs

**Verify**

- [ ] Logged-in run now does not ask for username/password/server
- [ ] Wrong stored credentials still fail redeem gracefully (logged error, no crash)
- [ ] `npm run typecheck` passes

**Status:** ⏳ NOT STARTED

---

#### Step 9.7 — User-scoped tasks + history

**Goal:** Scheduled tasks and run history filtered by `user_id`.

**Build**

- [ ] `scheduled_tasks` / `run_history` include `user_id` NOT NULL (already in schema from 9.1 — no ALTER migration)
- [ ] `TaskStore` / `RunHistoryStore` — `listByUserId`, `record` includes `user_id`
- [ ] `scheduleFlow` attaches `user_id` from session
- [ ] List/cancel/history UI uses filtered queries only
- [ ] Display cards unchanged but data scoped

**Verify**

- [ ] User A schedules task; User B list is empty
- [ ] User A history does not show User B runs
- [ ] Guest runs do not appear in any user's history (or are omitted from DB)

**Status:** ⏳ NOT STARTED

---

#### Step 9.8 — SQLite codes per user

**Goal:** Replace JSON `codes.json` with per-user SQLite rows.

**Build**

- [ ] `codes` table keyed by `(user_id, game_id, code)` (already in schema from 9.1)
- [ ] `SqliteCodeStore` implements scrape/merge/redeem lookups scoped by `user_id`
- [ ] `redeemWorkflow` + `scrapePolicy` pass `userId` from session/task
- [ ] Remove JSON `codeStore` runtime path; drop `CODE_STORE_BASE_PATH` for codes
- [ ] **No** import of old `codes.json` — test data discarded with DB wipe

**Verify**

- [ ] User A redeems code X; User B still has X pending
- [ ] `hasScrapedToday` scoped per user
- [ ] No read/write of `src/data/**/codes.json` during run
- [ ] `npm run typecheck` + manual scrape + redeem smoke

**Status:** ⏳ NOT STARTED

---

#### Step 9.9 — Scheduler per user

**Goal:** Scheduled fires use correct credentials, codes, and Chrome profile.

**Build**

- [ ] `SchedulerRunner` trigger loads user by `scheduled_tasks.user_id`
- [ ] `chromeLauncher` uses `users.chrome_profile` per run (not global `CHROME_USER_DATA_DIR` only)
- [ ] Scheduled tasks register with `scrapePolicy: ifNotScrapedToday` per user
- [ ] Telegram notify (if used) still works per chat metadata

**Verify**

- [ ] Two users, two schedules — each fires with own credentials (log/profile path)
- [ ] Same code different redeem state per user after scheduled run
- [ ] Next-run display still correct per task

**Status:** ⏳ NOT STARTED

---

#### Step 9.10 — Account menu

**Goal:** Log out + delete account (no edit).

**Build**

- [ ] Main menu **Account** (logged-in only): Log out | Delete account
- [ ] **Log out** → clear session → return to startup gate (process keeps running)
- [ ] **Delete account** → confirm → delete user row + cascade codes/tasks/history + `fs.rm(chrome_profile)`
- [ ] No edit option; README/plan note: change account = delete + new account

**Verify**

- [ ] Log out → startup gate; log in again works
- [ ] Delete → user gone from login picker; Chrome folder removed
- [ ] Deleted user's tasks/history/codes not visible to anyone

**Status:** ⏳ NOT STARTED

---

#### Step 9.11 — Telegram parity

**Goal:** Same startup gate, session rules, and menus on Telegram.

**Build**

- [ ] `/start` → startup gate (Login | New account | Guest)
- [ ] In-memory `chatId` → `SessionContext` (cleared on `/stop`, log out, exit)
- [ ] Guest: run now only; logged-in: full menu + account
- [ ] `/stop` and bot shutdown clear session; next `/start` requires login again
- [ ] No `user_id` stored in Telegram message metadata for auto-login

**Verify**

- [ ] Telegram guest cannot schedule
- [ ] `/stop` then `/start` → startup gate (not auto-logged-in)
- [ ] Two users on same chat: login picker works
- [ ] Display cards render correctly in Telegram HTML

**Status:** ⏳ NOT STARTED

---

#### Step 9.12 — Cleanup + docs

**Goal:** Remove legacy paths; document env; full acceptance pass.

**Build**

- [ ] Remove `DATABASE_URL=json:...` task-store fallback (SQLite only)
- [ ] Update `.env.example` — `DATABASE_URL`, `CHROME_USER_DATA_DIR`, `CREDENTIALS_ENCRYPTION_KEY`
- [ ] Update `README.md` — auth flows, guest vs logged-in, no session persistence, key backup, **how to reset DB** (delete file / `db:reset`)
- [ ] Phase 10 Docker note: single DB volume + `/data/chrome/<user_id>/`
- [ ] Changelog entry

**Verify (full Phase 9 acceptance)**

- [ ] All steps 9.1–9.11 ✅
- [ ] `npm run build` + `npm run typecheck`
- [ ] CLI E2E: sign up → schedule → list → history → log out → guest run → exit → re-login
- [ ] Telegram E2E: same happy path
- [ ] Two users same game: isolated codes, tasks, history, Chrome profiles

**Status:** ⏳ NOT STARTED

---

## Phase 10 — Docker / Azure Deployment ⏳ IN PROGRESS

- [x] `deploy/Dockerfile`
- [x] `deploy/docker-compose.yml` (loads root `.env`)
- [x] `.env.example` — app config only
- [x] Deployment docs in root `README.md`
- [ ] Verify headless redeem in container
- [ ] Wire Azure VM / Container Apps with mounted `/data` volume (DB + chrome profiles)
- [ ] `.gitignore`: `deploy/instances/**/.env`, `deploy/instances/**/data/`

> **Note:** Phase 10 deploy assumes Phase 9 unified SQLite — one DB volume, no separate codes JSON mount.

---

## Roadmap — Input adapters


| Adapter                           | Status     |
| --------------------------------- | ---------- |
| Terminal CLI (Run now + Schedule) | ✅ Complete |
| Telegram bot                      | ✅ Complete |
| REST API                          | 🔮 Future  |
| Discord bot                       | 🔮 Future  |


---

## Future TODO

### Multi-capability platform (major)

> **Goal:** Support multiple unrelated automations (e.g. code redeemer, FB friend requests, IG reel downloader) behind the **same input adapters** (CLI, Telegram, future Discord/HTTP). Today adapters only drive redeem via `mainMenu` → `RedeemTask` → `runRedeemTask`. Add a **capability layer** so new bots plug in without forking menus or overloading `RedeemTask.metadata`.

**Current limitation:** input adapters are reusable; domain/application are redeem-only. `RedeemTask`, scheduler, run history, and `mainMenu` are hardcoded to scrape/redeem.

**Target:**

```text
CLI / Telegram / Discord / HTTP  →  Capability router menu  →  capabilityModules registry
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                  CodeRedeemer    FbFriendBot    IgReelDownloader
```

- Input adapters stay thin (`PromptPort`, session, call router).
- Capabilities own prompts, validation, execution, optional scheduling, and their own job/result types (`AppJob` union).
- Redeem becomes the first registered capability (`codeRedeemCapability`).
- Start after Phase 9 (per-user scoping) when possible.

- [ ] `CapabilityModule` interface + `capabilityModules.ts` registry (mirror `adapterModules.ts`)
- [ ] `AppJob` / result types — `RedeemTask` as one variant
- [ ] Capability router menu (replace or wrap redeem-only `mainMenu`)
- [ ] Migrate code redeem into `codeRedeemCapability`
- [ ] Scheduler + run history dispatch by job/capability type
- [ ] Wire CLI + Telegram through router (no redeem logic in adapters)
- [ ] Docs: how to add a capability; optional second-capability spike

### Email reporting

- [ ] `src/infrastructure/reporting/emailReporter.ts`
- [ ] Subscribe to `WorkflowEvent` on event bus (post-run hook)

### Concurrent scheduled runs

- [ ] Scheduler should support multiple concurrent scheduled runs without blocking — separate from the main event loop / job queue; do not block on `ticking` while long redeem runs execute

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
| 2026-06-09 | 9-plan  | Phase 9: multi-user, unified SQLite (no codes.json), migrations sketch |
| 2026-06-09 | 9-plan  | Phase 9: login/guest flows, users table, account menu, auth practices |
| 2026-06-09 | 9-plan  | Phase 9: no session persistence — re-login after exit (all adapters) |
| 2026-06-09 | 9-plan  | Phase 9: sequential subtasks 9.1–9.12 with per-step verify checklist |
| 2026-06-09 | 9-plan  | Phase 9: clean-slate schema (no incremental SQL migrations; wipe test DB) |
| 2026-06-08 | future  | Future TODO: multi-capability platform (capability registry + router) |

