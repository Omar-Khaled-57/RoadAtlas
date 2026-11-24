# Development

This page is for working on RoadAtlas in this repository. The current runtime is
described in [architecture.md](./architecture.md); product intent and older
implementation plans are kept separately in [docs/README.md](./README.md).

## Prerequisites

- **Node `>=22`** — declared in [`package.json`](../package.json) and used by
  [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
- **npm** — the repository uses npm workspaces (`client`, `server`).
- **PostgreSQL** — data routes and the server tests need a database reached by
  `DATABASE_URL`. The API can boot without it, but data routes answer 503; see
  [configuration.md](./configuration.md).

## Install and run

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run dev
```

Set `DATABASE_URL` (and auth values) in `server/.env` before using data routes.
The committed [`server/.env.example`](../server/.env.example) still names the
legacy `MONGODB_URI`; [`server/src/config/env.ts`](../server/src/config/env.ts)
is the authoritative list of variables the API validates. Apply
[`server/sql/schema.sql`](../server/sql/schema.sql) to a disposable development
database — the file starts with `DROP TABLE IF EXISTS` statements.

Local defaults come from [`client/vite.config.ts`](../client/vite.config.ts):
Vite on `http://localhost:5173` proxies `/api` to Express on port `4000`.
`VITE_API_URL` can remain empty.

## Command reference

Root scripts from [`package.json`](../package.json):

| Command                | Purpose                             |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Run server and client concurrently  |
| `npm run dev:server`   | Run the API in watch mode           |
| `npm run dev:client`   | Run the Vite dev server             |
| `npm run build`        | Build client, then server           |
| `npm run typecheck`    | Type-check both workspaces          |
| `npm run lint`         | ESLint                              |
| `npm test`             | Run the server Vitest suite         |
| `npm run format:check` | Check formatting with Prettier      |
| `npm run format`       | Write formatted files with Prettier |

Workspace scripts from [`client/package.json`](../client/package.json) and
[`server/package.json`](../server/package.json):

| Command                         | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `npm run dev -w client`         | Start Vite                                                       |
| `npm run build -w client`       | Type-check and build `client/dist`                               |
| `npm run preview -w client`     | Preview the built client                                         |
| `npm run typecheck -w client`   | Type-check the client                                            |
| `npm run dev -w server`         | Start Express with `tsx watch`                                   |
| `npm run db:dev -w server`      | Legacy in-memory MongoDB helper; not part of the current runtime |
| `npm run build -w server`       | Bundle the server into `server/dist`                             |
| `npm run build:api -w server`   | Bundle the Vercel handler into `api/_server.cjs`                 |
| `npm start -w server`           | Start the built server                                           |
| `npm test -w server`            | Run Vitest                                                       |
| `npm run typecheck -w server`   | Type-check the server                                            |
| `npm run user:create -w server` | Provision a user                                                 |
| `npm run backup -w server`      | Legacy MongoDB EJSON backup script                               |
| `npm run restore -w server`     | Legacy MongoDB EJSON restore script                              |

CI runs `npm ci`, `npm audit --audit-level=high`, `npm run format:check`,
`npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

## Repository structure

| Path                                                      | Responsibility                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| [`client/`](../client/src/App.tsx)                        | Vite SPA, routes, pages, components, data hooks, theme and i18n       |
| [`server/`](../server/src/app.ts)                         | Express app, routes, middleware, PostgreSQL pool, validation, scripts |
| [`shared/`](../shared/src/index.ts)                       | TypeScript domain contracts imported as `@shared`                     |
| [`api/`](../api/index.mjs)                                | Vercel function wrapper around the generated `api/_server.cjs`        |
| [`scripts/`](../scripts/add-hub.mjs)                      | Legacy seed and MongoDB copy helpers                                  |
| [`docs/`](./README.md)                                    | Product brief, ADRs, page specs, research and operations guides       |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | CI gates                                                              |

## Conventions

- Follow [`AGENTS.md`](../AGENTS.md) for TDAIM, i18n/RTL and routing rules.
- Use semantic CSS variables and logical properties; do not hard-code colors.
- Keep shared contracts in [`shared/src/index.ts`](../shared/src/index.ts).
- Add or change server endpoints in [`server/src/routes/`](../server/src/routes/roadmaps.ts)
  and mount them in [`server/src/app.ts`](../server/src/app.ts). Reads use
  `optionalAuth`; mutations use `requireAuth`; data routers are gated by
  `requirePersistence`.
- Keep browser persistence limited to the documented theme/language keys in
  [configuration.md](./configuration.md#application-settings-and-local-storage).
- Page specs describe original intent. Check the current status column in
  [`docs/pages/README.md`](./pages/README.md) before treating a spec as current.

## Adding a feature

1. Read the relevant [page spec](./pages/README.md), ADR and
   [`AGENTS.md`](../AGENTS.md); resolve conflicts explicitly.
2. Update [`shared/src/index.ts`](../shared/src/index.ts) when the API contract
   changes, and the SQL schema when persisted shape changes.
3. Implement the server route and validation; apply visibility and ownership
   rules on the server, never only in the client.
4. Add client data calls/hooks, then the page or component and its route in
   [`client/src/App.tsx`](../client/src/App.tsx).
5. Add both `en` and `ar` strings and verify RTL, themes and keyboard access.
6. Add server tests when behavior is testable, then run
   `npm run typecheck`, `npm run lint`, `npm test` and `npm run format:check`.

## Troubleshooting

| Symptom                                                       | Evidence and next check                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data routes answer 503 and health says `database: "disabled"` | `DATABASE_URL` is unset; set it and apply [`server/sql/schema.sql`](../server/sql/schema.sql)                                                     |
| Health says `database: "disconnected"`                        | `DATABASE_URL` is set but PostgreSQL is unreachable; check host, credentials and network access                                                   |
| State-changing request rejected from a script                 | [`server/src/middleware/origin.ts`](../server/src/middleware/origin.ts) requires a matching `Origin` header for `CLIENT_ORIGIN`                   |
| Login reports that sign-in is not configured                  | A 32+ character `JWT_SECRET` is required; with no database a valid `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` pair is also required                      |
| `npm test` fails with `ECONNREFUSED`                          | The tests expect PostgreSQL at the default URL in [`server/src/test/setup.ts`](../server/src/test/setup.ts); that file does not create the schema |
| `npm run format:check` or `npm run lint` reports issues       | Both were already reported at verification; see [testing.md](./testing.md#verification-run)                                                       |

## Known gaps

- There is no client test runner, browser/E2E suite or coverage report; see
  [testing.md](./testing.md).
- `npm run db:dev -w server`, `npm run backup -w server` and
  `npm run restore -w server` are legacy MongoDB helpers and are not aligned
  with the `pg` runtime.
- Several page specs and ADRs were written for a MongoDB/Mongoose stack; the
  current-status notes in [`docs/pages/README.md`](./pages/README.md) and
  [architecture.md](./architecture.md) take precedence.

## Sources

- [`package.json`](../package.json), [`client/package.json`](../client/package.json), [`server/package.json`](../server/package.json)
- [`client/vite.config.ts`](../client/vite.config.ts), [`server/src/app.ts`](../server/src/app.ts), [`server/sql/schema.sql`](../server/sql/schema.sql)
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`AGENTS.md`](../AGENTS.md), [`docs/README.md`](./README.md)
