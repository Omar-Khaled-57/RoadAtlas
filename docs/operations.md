# Operations

How RoadAtlas is configured, observed, backed up and recovered. Code-level conventions live in
[`AGENTS.md`](../AGENTS.md); this page is for whoever runs the service.

## Environment

The server reads `server/.env` in development (copy `server/.env.example`) and process environment
variables in production. Invalid values fail fast at boot (zod schema in `server/src/config/env.ts`).

| Variable              | Required                               | Notes                                                           |
| --------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `NODE_ENV`            | no (`development`)                     | `production` tightens cookies, CORS and errors                  |
| `PORT`                | no (`4000`)                            |                                                                 |
| `CLIENT_ORIGIN`       | **yes in production**                  | Exact origin allowed by CORS and the CSRF guard                 |
| `MONGODB_URI`         | **yes in production**                  | Without it data routes answer 503 and health reports `disabled` |
| `JWT_SECRET`          | **yes in production** (32+ characters) | Rotating it signs everybody out                                 |
| `ADMIN_EMAIL`         | no                                     | Optional bootstrap account; also provisioned into the DB        |
| `ADMIN_PASSWORD_HASH` | same as `ADMIN_EMAIL`                  | bcrypt hash, never the plaintext                                |
| `LOG_LEVEL`           | no (`debug` dev, `info` prod)          | `debug`, `info`, `warn`, `error`                                |

`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` must be set together. That pair is only needed when the database
has no user yet and you want an account without the provisioning script; with a database, the owner is
created with the script instead:

```bash
USER_PASSWORD='choose-a-long-password' npm run user:create -w server -- --email owner@example.com
```

There is no `--password` flag (command-line arguments leak through the process list); in an
interactive terminal the script prompts with hidden input. RoadAtlas supports exactly one account, and
the script refuses to create a second one.

A missing `MONGODB_URI` is never fatal: the API still boots, `GET /api/health` reports
`database: "disabled"` and data routes answer 503. That keeps a misconfigured deployment diagnosable
instead of turning every request into a bare function error.

## Logging and health

- One JSON object per line on stdout/stderr (`time`, `level`, `message`, plus fields). Request
  bodies, cookies and passwords are never logged.
- Every response carries `X-Request-Id` (a caller-provided id is reused when it matches
  `[A-Za-z0-9._-]{8,64}`), every access-log line includes it, and client-visible error bodies repeat
  it as `requestId`.
- `GET /api/health` returns `status`, `service`, `time`, `uptimeSeconds` and `database`
  (`connected` | `disconnected` | `disabled`). Use it as a liveness probe; treat
  `database: "disconnected"` as not-ready.
- `SIGTERM`/`SIGINT` stop accepting connections, close idle ones, disconnect from MongoDB and exit
  with code 0; a 10-second watchdog forces exit if a connection hangs.
  `unhandledRejection`/`uncaughtException` are logged and drain the same way but exit with code 1.
- The API allows 300 requests/minute per client IP (in-memory store; a multi-instance deployment
  needs a shared store). `/api/auth/login` has a stricter 20-per-15-minutes limiter.

## Backup and restore

Backups are single-file EJSON dumps (types such as `ObjectId` and `Date` survive) of every
collection:

```bash
npm run backup -w server                       # -> server/backups/roadatlas-<timestamp>.json
npm run backup -w server -- --out /tmp/r.json
```

The file is created with mode `0600`.

Restore upserts documents by `_id`; `--drop` empties each collection first and requires `--yes`:

```bash
npm run restore -w server -- --file server/backups/roadatlas-<timestamp>.json
npm run restore -w server -- --file server/backups/roadatlas-<timestamp>.json --drop --yes
```

Take a fresh backup before a `--drop` restore; a failure part-way through leaves the database in the
restored-so-far state.

`backups/` is git-ignored. Dumps contain password hashes and personal data: encrypt them at rest,
restrict access, and never commit them. For managed MongoDB (Atlas) prefer its native snapshots as
the primary mechanism and use these scripts for local/staging copies or migrations.

## Vercel deployment

`https://road-atlas.vercel.app` is one Vercel project serving both the SPA and the API from the same
origin:

- Root directory `.`, framework preset `None`, output directory `client/dist`.
- Build command `npm run build:api -w server && npm run build -w client`. The first step bundles
  `server/src/serverless.ts` into `api/_server.cjs` (CommonJS, dependencies external) because the
  Express source is TypeScript with bundler-style imports that Vercel's own compiler does not resolve.
- `vercel.json` sends `/api/*` to the `api/index.mjs` function and everything else to
  `/index.html`. The API rewrite has to stay above the SPA fallback, otherwise `/api/*` returns HTML.
- Variables for both Production and Preview: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`
  (`https://road-atlas.vercel.app`). Vercel sets `NODE_ENV=production` itself.
- `api/_server.cjs` is generated and git-ignored — never edit it by hand; run `npm run build:api -w server`
  if you need it locally.
- `connectDb()` caches the connection (and the in-flight connect promise) across invocations, so a warm
  function reuses one pool. If the database is unreachable the function still boots and data routes
  answer 503.
- Atlas must allow `0.0.0.0/0` in Network Access: Vercel functions have no fixed egress address.

Deploy and verify:

```bash
vercel --prod
curl -s https://road-atlas.vercel.app/api/health   # expect "database":"connected"
```

`database: "disabled"` means `MONGODB_URI` is missing; `"disconnected"` means it is set but unreachable
(check the Atlas IP allowlist and the password).

## Adding real content

Local data lives in the `roadatlas-mongo` container (`podman start roadatlas-mongo`; the volume keeps it
across restarts). Two ways to add records:

1. The owner UI: sign in at `/login`, then use the dashboard / `/map` actions. This is the normal path
   and the only one that fills progress and notes.
2. `scripts/add-hub.mjs` for the initial structure. It reads `scripts/hub-content.json` (one hub plus its child
   tech roadmaps) and upserts by `legacyKey`, so editing the JSON and re-running updates the same nodes:

```bash
node scripts/add-hub.mjs
```

Parent rules apply (`hub → hub|tech|pipeline`, `tech → tech`, `pipeline → pipeline`), so a hub's children
must be `tech` or nested hubs.

## Copying the local database to Atlas

`mongodump`/`mongorestore` run inside the container, which is the only place they are installed:

```bash
ATLAS_URI='mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/roadatlas' ./scripts/push-db-to-atlas.sh
```

The dump is written to a temp file first, then restored into the `roadatlas` database and verified by
counting `users`, `roadmaps`, `steps`, `progresses` and `foci`. Add `--drop --yes` to empty the remote
collections before restoring; without it the restore upserts by `_id`. `TARGET_DB` overrides the target
database name. Because the owner's password hash travels with `users`, the login works on the target
exactly as it does locally.

## Deploy checklist

1. Set the production environment variables above; serve the client from `CLIENT_ORIGIN` over HTTPS
   (session cookies are `Secure` + `SameSite=None` in production).
2. `npm ci && npm run build`, then run `node server/dist/index.js` (or use `npm start -w server`).
3. Terminate TLS in front of the API and keep `trust proxy` at its production setting (1 hop).
4. Verify `GET /api/health` shows `database: "connected"` and that `POST /api/auth/login` works.
5. Schedule `npm run backup -w server` and store the output outside the host.
6. Point the process manager at `SIGTERM` (default) so shutdown can drain.
7. Non-browser clients (curl, monitors) must send `Origin: <CLIENT_ORIGIN>` on state-changing
   requests; the CSRF guard rejects mutations without a matching `Origin` header.

## CI

`.github/workflows/ci.yml` runs (on push/PR) `npm ci`, `npm audit --audit-level=high`,
`format:check`, `typecheck`, `lint`, `test` and `build`. Actions are pinned to commit SHAs.
