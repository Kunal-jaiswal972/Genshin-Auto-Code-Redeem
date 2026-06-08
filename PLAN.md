# Auto Code Redeemer v2 — Implementation Plan

> See **[AGENTS.md](./AGENTS.md)** for conventions, stack, and agent rules.

## Phases 1–6b ✅ COMPLETE

## Phase 7 — Azure VM / Docker Deployment ⏳ NOT STARTED

- One container or VM per Hoyoverse account
- Separate `.env` + `CODE_STORE_PATH` + Chrome profile per instance

---

## Phase 8 — Cleanup ✅ COMPLETE

- [x] Deleted legacy `scripts/`, `server/`, `src/db/`
- [x] Removed old GitHub Actions workflow
- [x] Removed unused errors, exports, and dead code

---

## Future TODO — Email Reporting

- [ ] `src/reporting/emailReporter.ts`

---

## Changelog

| Date | Phase | Notes |
|------|-------|-------|
| 2026-06-08 | 6 | Terminal prompts for manual scrape + credentials |
| 2026-06-08 | 6b | Single-instance env-only; JSON code store; no MongoDB |
| 2026-06-08 | 8 | Removed legacy folders and dead code |
