# Architecture

## Shape of the app

RoadAtlas is an npm-workspaces monorepo with a browser SPA, one Express API,
and a shared TypeScript contract package. There is no server-side rendering:
[`client/index.html`](../client/index.html) boots React, and React Router owns
every route.

```
Browser (Vite + React SPA)
├── reads/writes ──► /api/* (axios + TanStack Query, cookie included)
└── theme/locale ──► localStorage + <html data-theme/lang/dir>

Local development
├── Vite :5173 ──proxy /api──► Express :4000 (tsx watch)
└── PostgreSQL (DATABASE_URL)

Vercel (single project, same origin)
├── client/dist ──► static SPA + SPA fallback
└── api/index.mjs ──► generated api/_server.cjs ──► Express app ──► PostgreSQL
```

The local entry points are [`server/src/index.ts`](../server/src/index.ts) and
[`client/src/main.tsx`](../client/src/main.tsx). The serverless entry is
[`server/src/serverless.ts`](../server/src/serverless.ts), bundled to
`api/_server.cjs` by `npm run build:api -w server` and re-exported by
[`api/index.mjs`](../api/index.mjs). `api/_server.cjs` is generated and
git-ignored; do not edit it by hand.

## Technology stack

| Layer    | Actual dependencies and files                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client   | React, React Router, Vite, Tailwind v4, TanStack Query, axios, i18next/react-i18next, React Flow (`@xyflow/react`), lucide-react, react-markdown — [`client/package.json`](../client/package.json) |
| Server   | Express, `pg`, zod, bcryptjs, jsonwebtoken, cookie-parser, cors, helmet, express-rate-limit — [`server/package.json`](../server/package.json)                                                      |
| Shared   | TypeScript domain types in [`shared/src/index.ts`](../shared/src/index.ts), aliased as `@shared` in [`client/vite.config.ts`](../client/vite.config.ts)                                            |
| Database | PostgreSQL; schema in [`server/sql/schema.sql`](../server/sql/schema.sql), pool in [`server/src/lib/pg-db.ts`](../server/src/lib/pg-db.ts)                                                         |
| Tooling  | TypeScript, ESLint, Prettier, Vitest + supertest, concurrently — root [`package.json`](../package.json) and [`server/vitest.config.ts`](../server/vitest.config.ts)                                |

Earlier docs describe MongoDB/Mongoose. The running server uses `pg` and
`DATABASE_URL`; legacy scripts that still import `mongoose` are called out in
[configuration.md](./configuration.md#known-gaps).

## Directory map

| Path                                                              | Responsibility                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`client/src/App.tsx`](../client/src/App.tsx)                     | Route table, home page composition, lazy-loaded page imports                                              |
| [`client/src/pages/`](../client/src/pages/RoadmapsPage.tsx)       | One component per route                                                                                   |
| [`client/src/components/`](../client/src/components/AppShell.tsx) | Shell, theme/language toggles, dialogs, focus panels, badges, background                                  |
| [`client/src/data/`](../client/src/data/api.ts)                   | Typed API client and React Query hooks; no demo fallback for roadmap data                                 |
| [`client/src/i18n/`](../client/src/i18n/index.ts)                 | i18next setup and `en`/`ar` resources                                                                     |
| [`client/src/theme/`](../client/src/theme/ThemeProvider.tsx)      | Three-theme context and persistence                                                                       |
| [`server/src/app.ts`](../server/src/app.ts)                       | Middleware order and router mounting under `/api`                                                         |
| [`server/src/routes/`](../server/src/routes/roadmaps.ts)          | HTTP handlers for auth, health, roadmaps, steps, metrics, comparisons, notes, decisions, and focus        |
| [`server/src/middleware/`](../server/src/middleware/auth.ts)      | Request id/logging, trusted-origin guard, rate limits, auth, persistence gate, errors                     |
| [`server/src/lib/`](../server/src/lib/dao.ts)                     | PostgreSQL pool, small DAO, DTO mapping, parsing, localization, logging, API errors                       |
| [`server/sql/schema.sql`](../server/sql/schema.sql)               | Relational schema for users, roadmaps, steps, progress, comparisons, metrics, notes, decisions, and focus |
| [`api/`](../api/index.mjs)                                        | Vercel function wrapper around the generated Express bundle                                               |
| [`scripts/`](../scripts/add-hub.mjs)                              | Seed helpers and local-content tooling                                                                    |
| [`docs/`](./README.md)                                            | Product brief, ADRs, page specs, research, and operations docs                                            |

## Request flow

1. [`client/src/lib/api.ts`](../client/src/lib/api.ts) creates an axios client
   with `withCredentials: true` and `VITE_API_URL` as an optional base URL.
   In development the Vite proxy forwards `/api` to port `4000`; in production
   the SPA and API share a Vercel origin.
2. [`client/src/data/api.ts`](../client/src/data/api.ts) exposes typed calls;
   [`client/src/data/queries.ts`](../client/src/data/queries.ts) wraps them in
   TanStack Query caches and mutations.
3. [`server/src/app.ts`](../server/src/app.ts) applies request context, access
   log, Helmet, CORS, JSON parsing, cookie parsing, a trusted-origin guard for
   state-changing methods, and API rate limits before routing.
4. Read routes use `optionalAuth` to expose owner-only fields only when a valid
   session exists; mutation routes use `requireAuth`. Data routers except
   health/auth/focus are behind `requirePersistence`, which returns 503 when
   `DATABASE_URL` is absent.
5. [`server/src/lib/dao.ts`](../server/src/lib/dao.ts) builds parameterized SQL
   with quoted identifiers; JSON/localized fields are stored as `jsonb`.

## Auth, ownership, and visibility

- The session cookie is `roadatlas_session`, httpOnly, seven days, `Secure` and
  `SameSite=None` in production, `SameSite=Lax` locally. See
  [`middleware/auth.ts`](../server/src/middleware/auth.ts).
- Passwords are bcrypt hashes. `JWT_SECRET` must be at least 32 characters.
  The owner id is derived from the verified session, never from the request
  body; logout increments `sessionVersion` when a database is configured.
- Domain records carry `ownerId` and `visibility: 'public' | 'private'`. The
  shared contracts are in [`shared/src/index.ts`](../shared/src/index.ts); the
  model rationale is [ADR 0004](./decisions/0004-domain-model-v2.md).

## Storage and integration boundaries

- **Persistence:** PostgreSQL via `pg`; no ORM in the runtime path. The schema
  uses UUID primary keys, `jsonb` for localized fields, and foreign keys with
  cascades.
- **Client state:** TanStack Query caches server data. The only browser
  persistence keys found in tracked code are `roadatlas.theme` and
  `roadatlas.lang`; see [configuration.md](./configuration.md#application-settings-and-local-storage).
- **External integrations:** none are called from the API. The fixed tech
  catalogue is local display copy in
  [`client/src/data/techCatalogue.ts`](../client/src/data/techCatalogue.ts).
- **Deployment:** [`vercel.json`](../vercel.json) sets framework `null`,
  installs with `npm install`, runs the API bundle then the client build,
  serves `client/dist`, rewrites `/api/(.*)` to the function and everything
  else to `/index.html`. CI is in
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Sources

- [`package.json`](../package.json), [`client/package.json`](../client/package.json), [`server/package.json`](../server/package.json)
- [`server/src/app.ts`](../server/src/app.ts), [`server/src/serverless.ts`](../server/src/serverless.ts), [`vercel.json`](../vercel.json)
- [`client/vite.config.ts`](../client/vite.config.ts), [`client/src/App.tsx`](../client/src/App.tsx)
