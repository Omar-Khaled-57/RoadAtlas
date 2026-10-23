# Operations

How RoadAtlas is configured, observed, backed up and recovered. Code-level conventions live in
[`AGENTS.md`](../AGENTS.md); this page is for whoever runs the service.

## Environment

The server reads `server/.env` in development (copy `server/.env.example`) and process environment
variables in production. Invalid values fail fast at boot (zod schema in `server/src/config/env.ts`).

| Variable              | Required                               | Notes                                           |
| --------------------- | -------------------------------------- | ----------------------------------------------- |
| `NODE_ENV`            | no (`development`)                     | `production` tightens cookies, CORS and errors  |
| `PORT`                | no (`4000`)                            |                                                 |
| `CLIENT_ORIGIN`       | **yes in production**                  | Exact origin allowed by CORS and the CSRF guard |
| `MONGODB_URI`         | unless an env admin is set             | Without it every data route answers 503         |
| `JWT_SECRET`          | **yes in production** (32+ characters) | Rotating it signs everybody out                 |
| `ADMIN_EMAIL`         | required only without a database       | Bootstrap account; also provisioned into the DB |
| `ADMIN_PASSWORD_HASH` | same as `ADMIN_EMAIL`                  | bcrypt hash, never the plaintext                |
| `LOG_LEVEL`           | no (`debug` dev, `info` prod)          | `debug`, `info`, `warn`, `error`                |

`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` must be set together. With a database, additional users are
created with the provisioning script instead:

```bash
USER_PASSWORD='choose-a-long-password' npm run user:create -w server -- --email owner@example.com
# or: npm run user:create -w server -- --email owner@example.com --password '...'
```

There is no interactive prompt. Prefer `USER_PASSWORD`: a `--password` value is visible to other
users through the process list. Passwords must be at least 12 characters; duplicates are refused.

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
