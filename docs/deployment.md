# Deployment

RoadAtlas has one committed deployment target: a Vercel project that serves the
SPA and the Express API from the same origin. A long-running Node start command
is also available, but no process-manager or container configuration is
committed. See [operations.md](./operations.md) for health, logging and
backup/restore details.

## Build commands and artifacts

| Command                       | Output                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| `npm run build`               | Builds `client/dist` and `server/dist` (CI gate)                         |
| `npm run build -w client`     | Runs `tsc --noEmit` then Vite build into `client/dist`                   |
| `npm run build -w server`     | Bundles `server/src/index.ts` into `server/dist` with `tsup`             |
| `npm run build:api -w server` | Bundles `server/src/serverless.ts` into `api/_server.cjs` with `esbuild` |
| `npm start -w server`         | Runs the built `server/dist/index.js`                                    |
| `npm run preview -w client`   | Serves the built client locally via Vite preview                         |

`client/dist`, `server/dist` and `api/_server.cjs` are generated and git-ignored.
`api/_server.cjs` is imported by [`api/index.mjs`](../api/index.mjs) and must not
be edited by hand.

## Vercel configuration

[`vercel.json`](../vercel.json) is the deployment source of truth:

| Setting           | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| `framework`       | `null`                                                   |
| `installCommand`  | `npm install`                                            |
| `buildCommand`    | `npm run build:api -w server && npm run build -w client` |
| `outputDirectory` | `client/dist`                                            |
| API rewrite       | `/api/(.*)` → `/api/index`                               |
| SPA fallback      | `/(.*)` → `/index.html`                                  |

The API rewrite must stay before the SPA fallback. The function wrapper
[`api/index.mjs`](../api/index.mjs) exports the handler from
[`server/src/serverless.ts`](../server/src/serverless.ts), which calls
`connectDb()` and normalizes the request path before passing it to the Express
app. If the database is unavailable, the function still boots; health answers
and data routes fail closed with 503.

## Production environment

[`server/src/config/env.ts`](../server/src/config/env.ts) fails fast in
production when `CLIENT_ORIGIN` or `JWT_SECRET` is missing. `JWT_SECRET` must be
at least 32 characters. Set these values in the hosting environment, not in
committed files.

| Variable                              | Deployment note                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `CLIENT_ORIGIN`                       | Required; exact deployed client origin used by CORS and the state-changing origin guard                                      |
| `JWT_SECRET`                          | Required; 32+ character signing secret                                                                                       |
| `DATABASE_URL`                        | Not fatal when absent, but strongly recommended: without it health reports `database: "disabled"` and data routes answer 503 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Optional bootstrap owner pair; must be set together in production and the hash must be bcrypt                                |
| `NODE_ENV`                            | Vercel sets `production` itself                                                                                              |
| `VITE_API_URL`                        | Can stay empty because the SPA and API share an origin                                                                       |

The current API can create the first owner from the configured admin pair when a
database and session secret are present; see
[`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts). The
[`server/scripts/create-user.mjs`](../server/scripts/create-user.mjs) script is
a legacy MongoDB provisioner and is not aligned with the current PostgreSQL
runtime.

## Database preparation

Apply [`server/sql/schema.sql`](../server/sql/schema.sql) to the target
PostgreSQL database. The file begins with `DROP TABLE IF EXISTS` statements, so
do not run it against a database that holds data you need to keep. There is no
committed migration ledger or PostgreSQL backup/restore script; provider-side
snapshots are the documented option in [operations.md](./operations.md#backup-and-restore).

## Long-running Node option

For a standalone Node deployment, install with `npm ci`, run `npm run build`,
apply the schema, set the production environment variables, and start with
`npm start -w server`. Terminate TLS in front of the process; the app sets
`trust proxy` to one hop in production. The process handles `SIGTERM`/`SIGINT`
by draining connections and closing the PostgreSQL pool. No Docker image,
compose file, Kubernetes manifest, systemd unit or process-manager
configuration is present in the repository.

## Deploy checklist

1. Set `DATABASE_URL`, `JWT_SECRET` and `CLIENT_ORIGIN` in the target environment.
2. Apply the PostgreSQL schema to a database reachable from the deployment.
3. Deploy with the Vercel configuration above, or build and start the server with
   the Node commands above.
4. Call `GET /api/health` and expect `database: "connected"`. `"disabled"` means
   `DATABASE_URL` is missing; `"disconnected"` means it is set but unreachable.
5. Verify `POST /api/auth/login` with the provisioned owner.
6. Confirm state-changing API requests send `Origin: <CLIENT_ORIGIN>`; the
   origin guard rejects mutations without a matching header.
7. Arrange provider-level backups; no repository script currently does this for
   PostgreSQL.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on pushes to
`master`/`main` and pull requests. It runs `npm ci`,
`npm audit --audit-level=high`, `npm run format:check`, `npm run typecheck`,
`npm run lint`, `npm test`, and `npm run build`. It does not deploy. See
[testing.md](./testing.md) for the verification results in this workspace.

## Known gaps

- No local production preview stack is configured; Vercel environment values
  are not committed.
- No container, process-manager or infrastructure-as-code configuration exists.
- No PostgreSQL migration ledger, seed import or backup/restore script exists;
  the legacy scripts target MongoDB.
- The tests require a live PostgreSQL database and are not part of a deployed
  smoke test.

## Sources

- [`vercel.json`](../vercel.json), [`api/index.mjs`](../api/index.mjs), [`server/src/serverless.ts`](../server/src/serverless.ts)
- [`package.json`](../package.json), [`client/package.json`](../client/package.json), [`server/package.json`](../server/package.json)
- [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/index.ts`](../server/src/index.ts), [`server/sql/schema.sql`](../server/sql/schema.sql)
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`docs/operations.md`](./operations.md)
