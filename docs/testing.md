# Testing

## Commands from the manifests

Root scripts in [`package.json`](../package.json):

| Command                | Manifest script                                              | Purpose                       |
| ---------------------- | ------------------------------------------------------------ | ----------------------------- |
| `npm test`             | `npm run test -w server`                                     | Run the server's Vitest suite |
| `npm run typecheck`    | `npm run typecheck -w client && npm run typecheck -w server` | Type-check both workspaces    |
| `npm run lint`         | `eslint .`                                                   | Lint the repository           |
| `npm run format:check` | `prettier --check .`                                         | Check formatting              |
| `npm run format`       | `prettier --write .`                                         | Write formatted files         |
| `npm run build`        | `npm run build -w client && npm run build -w server`         | Build both workspaces         |

The server test command is `vitest run`, configured in
[`server/vitest.config.ts`](../server/vitest.config.ts) with
`src/**/*.test.ts`, a setup file, `fileParallelism: false`, and 30s/60s test and
hook timeouts.

## What exists today

| File                                                  | Tests | Coverage                                                                                                                                                                                                        |
| ----------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`server/src/app.test.ts`](../server/src/app.test.ts) | 8     | Health response, 404 JSON, request-id generation/reuse, Helmet headers, trusted-origin rejection, persistence health state, `trust proxy`, and login rate limiting                                              |
| [`server/src/api.test.ts`](../server/src/api.test.ts) | 18    | Session revocation, roadmap ownership and visibility, parent/kind validation, zod boundary validation, steps/progress, comparisons/metrics/notes/decisions, private-note isolation, and focus singleton updates |

The test bootstrap in [`server/src/test/setup.ts`](../server/src/test/setup.ts)
sets `NODE_ENV=test`, a demo `CLIENT_ORIGIN`, a 32+ character `JWT_SECRET`, admin
credentials, `LOG_LEVEL=warn`, and a `DATABASE_URL` defaulting to
`postgresql://postgres:postgres@localhost:5432/roadatlas_test`. Despite the
comment in that file, it does not execute the schema SQL; the database and
schema must already exist.

There are no client tests, no browser/E2E suite, and no coverage report
committed. No coverage tool is configured in the manifests.

## Verification run

A run of `npm test` in this workspace on Node 22 used the default test database
URL. No PostgreSQL server was listening on `localhost:5432`, so the result was:

- 2 test files, 26 tests
- 7 passed, 19 failed
- Failures: `ECONNREFUSED` from `pg` for `api.test.ts`, plus one health assertion
  expecting `database: "connected"` in `app.test.ts`

`npm run typecheck` completed cleanly. `npm run lint` exited 0 with one
`react-hooks/exhaustive-deps` warning in
[`client/src/components/Dialog.tsx`](../client/src/components/Dialog.tsx).
`npm run format:check` was not clean at verification; the reported files were
pre-existing style issues, not test failures.

CI in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs
`npm ci`, `npm audit --audit-level=high`, `format:check`, `typecheck`, `lint`,
`test`, and `build` on pushes to `master`/`main` and on pull requests, with
pinned action SHAs.

## How to run the API tests

Provide a PostgreSQL database with [`server/sql/schema.sql`](../server/sql/schema.sql)
applied and point `DATABASE_URL` at it, then run `npm test`. The tests delete and
recreate records in that database's tables; use a dedicated test database.

## Known gaps

- Automated tests are server-only.
- Tests depend on a live PostgreSQL instance; there is no in-memory fallback.
- The setup file comment about running schema SQL does not match its code.
- No coverage threshold is configured.
- Formatting and one React Hook warning remain unresolved at verification.

## Sources

- [`package.json`](../package.json), [`server/package.json`](../server/package.json)
- [`server/vitest.config.ts`](../server/vitest.config.ts), [`server/src/test/setup.ts`](../server/src/test/setup.ts)
- [`server/src/app.test.ts`](../server/src/app.test.ts), [`server/src/api.test.ts`](../server/src/api.test.ts)
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
