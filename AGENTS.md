# AGENTS.md — Auto Code Redeemer v2

Guidance for AI agents and contributors working on this repository.

## Application Overview

**Auto Code Redeemer** is a standalone Node.js automation script that:

1. **Scrapes** global promotional codes for supported games
2. **Persists** codes and redemption status in a local **JSON file** (one file per game)
3. **Redeems** codes via `puppeteer-core` against a local Chrome debug profile

There is **no web server**, no REST API, no frontend, and **no database**. One instance = one Hoyoverse account from `.env`. To run multiple accounts or games, deploy separate instances (e.g. Docker containers) each with its own `.env`.

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

- **Game modules** — each game is a self-contained plug-in under `src/games/<gameId>/`.
- **Single registration point** — new games are wired in `src/games/registry.ts` only.
- **Registries** — redeem dispatch via `redeemerRegistry.ts`; scrape uses `getGameModule()` directly.
- **Separation of concerns** — config, types, storage, services, browser, and CLI are separate layers.
- **Pure script** — one entry point (`src/index.ts`), runs to completion, exits.
- **Single account per instance** — credentials never stored in code or JSON; only in `.env` / container secrets.

### Chrome / Puppeteer Pattern

- Use `puppeteer-core`, not bundled `puppeteer`
- Dedicated profile: `%LOCALAPPDATA%\Google\Chrome\DebugProfile`
- Launch Chrome with `--remote-debugging-port`, connect via `puppeteer.connect()`
- Login via saved Chrome session + `.env` credentials when needed

---

## Adding a New Game

**Do not scatter game-specific logic across orchestrator, env, or services.** Follow this checklist:

### 1. Declare the game id

Add the id string to `GameId` in `src/config/constants.ts`:

```ts
export const GameId = {
  GENSHIN: "genshin",
  HSR: "hsr",   // example
} as const;
```

### 2. Create the game module folder

```
src/games/<gameId>/
├── index.ts           # exports GameModule (required)
├── config.ts          # URLs, selectors, wiki source
├── credentials.ts     # parseCredentials + requiredEnvVars
├── scraper.ts         # scrapeCodes()
└── redeemer.ts        # redeemCodes() — import parseRedeemMessage from hoyoverse/
```

**Hoyoverse games** (Genshin, HSR, ZZZ) share the same gift-page modal text. Reuse `src/games/hoyoverse/parseRedeemMessage.ts` in your redeemer — do not copy it per game.

Implement `GameModule` from `src/types/games.ts`:

| Field | Purpose |
|-------|---------|
| `id` | Must match `GameId` constant and folder name |
| `displayName` | Log label |
| `source` | Wiki/source label stored in JSON |
| `requiredEnvVars` | Documented env keys for this game |
| `parseCredentials` | Zod-validated parser for game env vars |
| `scrapeCodes` | Fandom/wiki fetch |
| `redeemCodes` | Puppeteer gift-page flow |

Reference implementation: `src/games/genshin/`.

### 3. Register the module (one line)

In `src/games/registry.ts`, import and append to `gameModules`:

```ts
import { hsrGameModule } from "./hsr/index.js";

export const gameModules = [genshinGameModule, hsrGameModule] as const satisfies readonly GameModule[];
```

That is the **only** wiring step outside the game folder. Redeem dispatch uses `getGameRedeemer()` from `redeemerRegistry.ts`.

### 4. Configure the instance `.env`

```env
GAME_ID=hsr
HSR_EMAIL=...
HSR_PASSWORD=...
HSR_SERVER=...
```

Code store path is derived automatically: `<CODE_STORE_BASE_PATH>/<GAME_ID>/codes.json`.

Game-specific env vars are validated by the module's `parseCredentials`, not in central `env.ts`.

### 5. What you do **not** need to change

| File | Why |
|------|-----|
| `src/core/orchestrator.ts` | Uses `getGameModule(env.gameId)` |
| `src/services/scrapeService.ts` | Dispatches via game module |
| `src/services/redemptionService.ts` | Dispatches via `getGameRedeemer()` |
| `src/storage/codeStore.ts` | Accepts any registered `gameId` |
| `src/config/env.ts` | Base env only; credentials delegated to module |

---

## Environment Variables

- Load only in `src/config/loadEnv.ts` (dotenv)
- Parse/validate only in `src/config/env.ts` (base) + each game's `credentials.ts`
- **Never** read `process.env` elsewhere

### Base env (all games)

| Variable | Purpose |
|----------|---------|
| `EXECUTION_MODE` | `manual` or `cron` |
| `GAME_ID` | Active game module key |
| `CODE_STORE_BASE_PATH` | Base directory; file is `<base>/<GAME_ID>/codes.json` |
| `CHROME_*` | Browser launch settings |
| `HEADLESS` | Headless Chrome for cron |

### Game env

Defined per module (`requiredEnvVars` + `parseCredentials`). Example for Genshin: `GENSHIN_EMAIL`, `GENSHIN_PASSWORD`, `GENSHIN_SERVER`.

---

## Code Store (JSON)

- **Path:** `<CODE_STORE_BASE_PATH>/<gameId>/codes.json` (default base: `./src/data`)
- **Set once in `.env`:** `CODE_STORE_BASE_PATH=./src/data` — `GAME_ID` picks the subfolder at runtime
- **One file per game instance** — JSON includes `"gameId"` and must match `GAME_ID`

Tracks scraped codes, wiki active/expired status, per-code redeem status, and last scrape date (cron gate).

---

## File & Code Conventions

### Function parameters

- **3+ parameters** → use a single **options object** with a named type (see `src/types/`)
- **1–2 parameters** → positional arguments are fine
- Do not add new multi-arg functions; refactor callers when touching existing ones

Example:

```ts
await clickElement({
  context: page,
  selector: genshinConfig.selectors.redeemSubmit,
  timeout: Delays.LONG,
  reason: "redeem submit",
});
```

### Folder Layout

```
src/
├── index.ts              # entry only
├── utils/                  # shared utilities (logger, wait, etc.)
├── types/                  # named interfaces & types
├── config/                 # env, constants (only place for process.env access)
├── core/                   # errors, orchestrator
├── storage/                # JSON code store
├── games/                  # per-game modules + registry
│   ├── registry.ts         # ← register new games here
│   ├── redeemerRegistry.ts
│   ├── hoyoverse/          # shared Hoyoverse gift-page helpers
│   └── <gameId>/           # game plug-in
├── browser/                # shared puppeteer helpers
├── services/               # scrape, redemption
├── cli/                    # terminal prompts (manual scrape only)
└── data/                   # JSON stores per game
    └── <gameId>/codes.json
```

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
- Hardcode game-specific URLs/selectors outside `src/games/<gameId>/`
- Register games anywhere other than `src/games/registry.ts`
