# Operations

How RoadAtlas is configured, observed, deployed, and backed up. Code-level
conventions live in [`AGENTS.md`](../AGENTS.md); this page is for whoever runs
the service.

## Environment

The server reads `server/.env` in development (copy
[`server/.env.example`](../server/.env.example)) and process environment
variables in production. The authoritative schema is the zod parser in
[`server/src/config/env.ts`](../server/src/config/env.ts); the committed
template still lists the legacy `MONGODB_URI` and must not be treated as the
current source of truth.

| Variable              | Required                               | Notes                                                               |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `NODE_ENV`            | no (`development`)                     | `production` tightens cookies, CORS, errors and `trust proxy`       |
| `PORT`                | no (`4000`)                            | Express listen port                                                 |
| `CLIENT_ORIGIN`       | **yes in production**                  | Exact origin allowed by CORS and the state-changing origin guard    |
| `DATABASE_URL`        | no (strongly recommended)              | PostgreSQL connection string; without it data routes answer 503     |
| `JWT_SECRET`          | **yes in production** (32+ characters) | Rotating it signs everybody out                                     |
| `ADMIN_EMAIL`         | no                                     | Optional bootstrap owner; must be paired with `ADMIN_PASSWORD_HASH` |
| `ADMIN_PASSWORD_HASH` | same as `ADMIN_EMAIL`                  | bcrypt hash, never plaintext                                        |
| `LOG_LEVEL`           | no (`debug` dev, `info` prod)          | `debug`, `info`, `warn`, `error`                                    |

The client has one public variable: `VITE_API_URL`, optional and defaulting to
the Vite proxy/same-origin API. See [configuration.md](./configuration.md).

A missing `DATABASE_URL` is never fatal: the API still boots,
`GET /api/health` reports `database: "disabled"`, and data routes answer 503.
That keeps a misconfigured deployment diagnosable instead of turning every
request into a bare function error. A configured but unreachable database
reports `database: "disconnected"`.

## Logging and health

- One JSON object per line on stdout/stderr (`time`, `level`, `message`, plus
  fields). Request bodies, cookies and passwords are never logged.
- Every response carries `X-Request-Id` (a caller-provided id is reused when it
  matches `[A-Za-z0-9._-]{8,64}`), every access-log line includes it, and
  client-visible error bodies repeat it as `requestId`.
- `GET /api/health` returns `status`, `service`, `time`, `uptimeSeconds` and
  `database` (`connected` | `disconnected` | `disabled`). Use it as a liveness
  probe; treat anything other than `connected` as not-ready for data work.
- `SIGTERM`/`SIGINT` stop accepting connections, close idle ones, close the
  PostgreSQL pool and exit with code 0; a 10-second watchdog forces exit if a
  connection hangs. `unhandledRejection`/`uncaughtException` are logged and
  drain the same way but exit with code 1.
- The API allows 300 requests/minute per client IP (in-memory store; a
  multi-instance deployment needs a shared store). `/api/auth/login` has a
  stricter 20-per-15-minutes limiter.

## Backup and restore

The server workspace declares `backup`, `restore`, and `user:create` scripts in
[`server/package.json`](../server/package.json), but those scripts still use
MongoDB EJSON, `mongoose`, and `MONGODB_URI`. They are not aligned with the
PostgreSQL runtime that reads `DATABASE_URL` and are not a supported backup path
for the current application.

There is no PostgreSQL dump/restore script in the repository. For a deployed
database, use the provider's snapshot/export tooling and restore it into a new
database, then verify `GET /api/health` reports `database: "connected"`. Dumps
contain password hashes and personal data: encrypt them at rest, restrict
access, and never commit them.

## Vercel deployment

[`vercel.json`](../vercel.json) describes one Vercel project serving both the
SPA and the API from the same origin:

- Root directory `.`, framework preset `None`, output directory `client/dist`.
- Build command `npm run build:api -w server && npm run build -w client`. The
  first step bundles [`server/src/serverless.ts`](../server/src/serverless.ts)
  into `api/_server.cjs` (CommonJS, dependencies external) because the Express
  source is TypeScript with bundler-style imports that Vercel's own compiler
  does not resolve.
- The API rewrite must stay above the SPA fallback; otherwise `/api/*` returns
  HTML.
- Set `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN` (the deployed client
  origin) for Production and Preview. Vercel sets `NODE_ENV=production` itself.
  `VITE_API_URL` can stay empty because the API is same-origin.
- `api/_server.cjs` is generated and git-ignored — never edit it by hand; run
  `npm run build:api -w server` if you need it locally.
- The PostgreSQL pool is module-level in
  [`server/src/lib/pg-db.ts`](../server/src/lib/pg-db.ts), so a warm function
  can reuse it. If the database is unreachable the function still boots and
  data routes answer 503.
- Network access rules for the database host are provider-specific and are not
  configured in this repository.

Deploy and verify through the normal Vercel workflow, then call
`GET /api/health` and expect `"database":"connected"`. A `"disabled"` result
means `DATABASE_URL` is missing; `"disconnected"` means it is set but
unreachable.

## Adding real content

The normal path is the owner UI: sign in at `/login` (or open the hidden login
dialog with the `OMR` sequence), then create roadmaps, steps, comparisons,
curves, notes, decisions, and focus rows. Data is persisted through the API in
[`server/src/routes/`](../server/src/routes/roadmaps.ts).

[`scripts/add-hub.mjs`](../scripts/add-hub.mjs) and
[`scripts/hub-content.json`](../scripts/hub-content.json) are legacy Mongo seed
helpers keyed by `legacyKey`; they do not write to the current PostgreSQL
schema. Do not rely on them for a deployed RoadAtlas instance.

## Copying the local database to a hosted database

[`scripts/push-db-to-atlas.sh`](../scripts/push-db-to-atlas.sh) targets MongoDB
via `mongodump`/`mongorestore` in a podman container. It predates the current
PostgreSQL runtime and is not a supported migration path for deployed
RoadAtlas data. Use PostgreSQL-native dump/restore tooling instead, and keep
the owner password hash out of version control.

## Deploy checklist

1. Set `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN` for the target
   environment; serve the client from that exact origin over HTTPS (session
   cookies are `Secure` + `SameSite=None` in production).
2. Apply [`server/sql/schema.sql`](../server/sql/schema.sql) to the target
   PostgreSQL database.
3. Install dependencies from the lockfile, run `npm run build`, then start the
   built server with `npm start -w server` for a long-running Node deployment,
   or use the Vercel function configuration described above.
4. Terminate TLS in front of the API and keep `trust proxy` at its production
   setting (1 hop).
5. Verify `GET /api/health` shows `database: "connected"` and that
   `POST /api/auth/login` works.
6. Arrange provider-level backups; no repository script currently does this for
   PostgreSQL.
7. Point the process manager at `SIGTERM` so shutdown can drain.
8. Non-browser clients (curl, monitors) must send `Origin: <CLIENT_ORIGIN>` on
   state-changing requests; the origin guard rejects mutations without a
   matching `Origin` header.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on push/PR with
`npm ci`, `npm audit --audit-level=high`, `format:check`, `typecheck`, `lint`,
`test`, and `build`. Actions are pinned to commit SHAs. See
[testing.md](./testing.md) for the current results of those checks.

## Sources

- [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/app.ts`](../server/src/app.ts)
- [`server/src/lib/pg-db.ts`](../server/src/lib/pg-db.ts), [`server/src/routes/health.ts`](../server/src/routes/health.ts)
- [`vercel.json`](../vercel.json), [`api/index.mjs`](../api/index.mjs), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
