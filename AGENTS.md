# RoadAtlas — Agent Guide

RoadAtlas is a platform to showcase, follow, track, and revisit technology
roadmaps. UI is TDAIM: theme-driven + `en`/`ar` direction-aware.

Monorepo (npm workspaces): `client/` (Vite + React + TS + Tailwind v4),
`server/` (Express + `pg` + TS), `shared/` (TypeScript contracts). Specs live in
`docs/` — read the relevant spec before implementing a page, and check
`docs/pages/README.md` for the implemented status.

The running API persists to PostgreSQL through `pg` and `DATABASE_URL`. Older
ADRs, page specs and scripts describe MongoDB/Mongoose; treat them as historical
context, not the current runtime.

## Commands (verified)

- `npm run dev` — server + client concurrently
- `npm run dev:server` / `npm run dev:client`
- `npm run build` — build client then server
- `npm run typecheck` — `tsc --noEmit` for client + server
- `npm run lint` — `eslint .`
- `npm test` — server Vitest suite (needs a PostgreSQL test database)
- `npm run format:check` — Prettier check
- `npm run format` — `prettier --write .`

Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run format:check`
before considering a change done; CI runs the same gates.

## Sources of truth

- `docs/architecture.md` — current runtime, entry points and request flow.
- `docs/configuration.md` — env vars, config files and local storage keys.
- `docs/operations.md` — deploy, health, logging and backup behavior.
- `docs/decisions/0002-tdaim-frontend-foundation.md` — theming + i18n rules (mandatory).
- `docs/decisions/0004-domain-model-v2.md` — domain intent (`ownerId`, `LocalizedString`, `visibility`); current ids are UUIDs in PostgreSQL.
- `docs/decisions/0003-information-architecture.md` — original routes and page priorities; current nav/footer live in `client/src/components/AppShell.tsx`.
- `docs/pages/*.md` — per-page section specs and implementation notes.
- `docs/research/react-native-vs-kmp.md` — founding research source.

## Conventions

- TDAIM: colors only via semantic CSS variables / `data-theme`; never hard-code colors.
- All user-visible text goes through i18n (`client/src/i18n/locales/{en,ar}.json`); support RTL with logical properties.
- Client routing lives in `client/src/App.tsx` (react-router); data via axios + React Query.
- Domain terms per model v2: `Roadmap.parentId` for branching, `Step.stage` for pipeline stages, `Comparison` criteria-as-data, typed `Metric` curves.
- The server derives `ownerId` from the verified session; the login entry is hidden and `OMR` is only a convenience for opening the dialog.

## Tooling

- LSP is enabled in `opencode.json` (built-in TypeScript + ESLint servers).
- Prefer LSP diagnostics plus the CLI commands above for feedback.
