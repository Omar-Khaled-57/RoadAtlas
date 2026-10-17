# RoadAtlas — Agent Guide

RoadAtlas is a platform to showcase, follow, track, and revisit technology
roadmaps. UI is TDAIM: theme-driven + `en`/`ar` direction-aware.

Monorepo (npm workspaces): `client/` (Vite + React 19 + TS + Tailwind v4),
`server/` (Express + Mongoose + TS). Specs live in `docs/` — read the relevant
spec before implementing a page.

## Commands (verified)

- `npm run dev` — server + client concurrently
- `npm run dev:server` / `npm run dev:client`
- `npm run build` — build client then server
- `npm run typecheck` — `tsc --noEmit` for client + server
- `npm run lint` — `eslint .`
- `npm run format` — `prettier --write .`

Run `npm run typecheck` and `npm run lint` before considering a change done.

## Sources of truth

- `docs/decisions/0002-tdaim-frontend-foundation.md` — theming + i18n rules (mandatory).
- `docs/decisions/0004-domain-model-v2.md` — domain model (`ownerId`, `LocalizedString`, `visibility`, timestamps).
- `docs/decisions/0003-information-architecture.md` — routes, page priorities, nav/footer.
- `docs/pages/*.md` — per-page section specs.
- `docs/research/react-native-vs-kmp.md` — research source.

## Conventions

- TDAIM: colors only via semantic CSS variables / `data-theme`; never hard-code colors.
- All user-visible text goes through i18n (`client/src/i18n/locales/{en,ar}.json`); support RTL with logical properties.
- Client routing lives in `client/src/App.tsx` (react-router); data via axios + React Query.
- Domain terms per model v2: `Roadmap.parentId` for branching, `Step.stage` for pipeline stages, `Comparison` criteria-as-data, typed `Metric` curves.

## Tooling

- LSP is enabled in `opencode.json` (built-in TypeScript + ESLint servers).
- Prefer LSP diagnostics plus the CLI commands above for feedback.
