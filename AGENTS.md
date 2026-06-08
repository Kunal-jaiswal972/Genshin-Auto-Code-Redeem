# AGENTS.md — Auto Code Redeemer v2

Guidance for AI agents and contributors working on this repository.

## Application Overview

**Auto Code Redeemer** is a standalone Node.js automation script that:

1. **Scrapes** global promotional codes for supported games
2. **Persists** codes and redemption status in a local **JSON file** (`CODE_STORE_PATH`)
3. **Redeems** codes via `puppeteer-core` against a local Chrome debug profile

There is **no web server**, no REST API, no frontend, and **no database**. One instance = one Hoyoverse account from `.env`. To run multiple accounts, deploy multiple instances (e.g. Docker containers) each with its own `.env` and `CODE_STORE_PATH`.

### Execution Modes

| Mode | Trigger | Scrape | Credentials |
|------|---------|--------|-------------|
| `manual` | `npm run start` | Prompt user (wiki fetch Y/n) | `.env` only |
| `cron` | `npm run cron` | Skip if already scraped today | `.env` only |

Deployed target: **Azure VM** or **Docker** daily cron, headless Chrome.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20+ |
| Language | TypeScript (`strict: true`) |
| State | JSON file (`src/storage/codeStore.ts`) |
| Browser | `puppeteer-core` + local Chrome `DebugProfile` |
| Validation | Zod (env + external inputs) |
| Scraping | axios + cheerio (Fandom MediaWiki API) |
| Logging | chalk via `src/utils/utils.ts` |

---

## Architecture Principles

- **Generalized game adapters** — scraping and redemption live under `src/games/<gameId>/`.
- **Separation of concerns** — config, types, storage, services, browser, and CLI are separate layers.
- **Pure script** — one entry point (`src/index.ts`), runs to completion, exits.
- **Single account per instance** — credentials never stored in code or JSON; only in `.env` / container secrets.

### Chrome / Puppeteer Pattern

- Use `puppeteer-core`, not bundled `puppeteer`
- Dedicated profile: `%LOCALAPPDATA%\Google\Chrome\DebugProfile`
- Launch Chrome with `--remote-debugging-port`, connect via `puppeteer.connect()`
- Login via saved Chrome session + `.env` credentials when needed

---

## File & Code Conventions

### File Naming

- **camelCase** for all source files: `loadEnv.ts`, `codeStore.ts`, `chromeLauncher.ts`

### Folder Layout

```
src/
├── index.ts              # entry only
├── utils/                  # shared utilities (logger, wait, etc.)
├── types/                  # named interfaces & types
├── config/                 # env, constants (only place for process.env access)
├── core/                   # errors, orchestrator
├── storage/                # JSON code store
├── games/                  # per-game adapters
├── browser/                # shared puppeteer helpers
├── services/               # scrape, redemption, credentials
└── cli/                    # terminal prompts (manual scrape only)
```

### Environment Variables

- Load only in `src/config/loadEnv.ts` (dotenv)
- Parse/validate only in `src/config/env.ts` (Zod → `AppEnv`)
- **Never** read `process.env` elsewhere
- `GENSHIN_EMAIL`, `GENSHIN_PASSWORD`, `GENSHIN_SERVER` required in both modes

---

## Code Store (JSON)

Default path: `./src/data/codes.json` (override with `CODE_STORE_PATH`).

Tracks scraped codes, wiki active/expired status, per-code redeem status, and last scrape date (cron gate).

---

## Commands

```bash
npm run build       # compile to dist/
npm run start       # manual mode (tsx)
npm run cron        # cron mode (tsx)
```

---

## Do Not

- Add a web server, Express routes, or React frontend
- Use `puppeteer` full package (use `puppeteer-core`)
- Store credentials in JSON or source code
- Add multi-user DB collections — use separate instances instead
