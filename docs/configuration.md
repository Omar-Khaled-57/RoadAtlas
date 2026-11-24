# Configuration

## Source of truth

The server validates its environment with a zod schema in
[`server/src/config/env.ts`](../server/src/config/env.ts). Copy
[`server/.env.example`](../server/.env.example) to `server/.env` for local
development; `.env` files are git-ignored. The client template is
[`client/.env.example`](../client/.env.example). In production set values in the
hosting environment, not in committed files. See
[deployment information in operations.md](./operations.md#vercel-deployment).

## Server environment

| Variable              | Default                                      | Where it is read                                                                                                                                                                | Notes                                                                                                                               |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`            | `development`                                | [`server/src/config/env.ts`](../server/src/config/env.ts)                                                                                                                       | Enum `development`, `production`, `test`. Production requires `CLIENT_ORIGIN` and `JWT_SECRET`.                                     |
| `PORT`                | `4000`                                       | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/index.ts`](../server/src/index.ts)                                                                      | Express listen port.                                                                                                                |
| `CLIENT_ORIGIN`       | `http://localhost:5173` outside production   | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/middleware/origin.ts`](../server/src/middleware/origin.ts), [`server/src/app.ts`](../server/src/app.ts) | Exact origin for CORS and the state-changing origin guard; required in production.                                                  |
| `DATABASE_URL`        | unset                                        | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/lib/pg-db.ts`](../server/src/lib/pg-db.ts)                                                              | PostgreSQL connection string. Missing value is not fatal at boot: health reports `database: "disabled"` and data routes return 503. |
| `JWT_SECRET`          | unset                                        | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts)                                                  | Required in production and at least 32 characters; rotating it signs everyone out.                                                  |
| `ADMIN_EMAIL`         | unset                                        | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts)                                                  | Optional bootstrap owner email; in production must be paired with `ADMIN_PASSWORD_HASH`.                                            |
| `ADMIN_PASSWORD_HASH` | unset                                        | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts)                                                  | bcrypt hash only; never store the plaintext. Must be paired with `ADMIN_EMAIL` in production.                                       |
| `LOG_LEVEL`           | `debug` in development, `info` in production | [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/src/lib/logger.ts`](../server/src/lib/logger.ts)                                                            | Enum `debug`, `info`, `warn`, `error`.                                                                                              |

`JWT_SECRET` shorter than 32 characters, an `ADMIN_PASSWORD_HASH` that is not a
bcrypt hash, and a production environment missing `CLIENT_ORIGIN`/`JWT_SECRET`
fail fast during schema validation. See
[`server/src/config/env.ts`](../server/src/config/env.ts).

## Client environment

| Variable       | Default | Where it is read                                                                                                           | Notes                                                                                                                                                                |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | `''`    | [`client/src/lib/api.ts`](../client/src/lib/api.ts), declared in [`client/src/vite-env.d.ts`](../client/src/vite-env.d.ts) | Optional API base URL. Empty uses the Vite proxy in development or same-origin `/api` in production. Unlike server keys, this value is public in the browser bundle. |

## Config files

| File                                                                                                                                                               | What it controls                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [`package.json`](../package.json)                                                                                                                                  | npm workspaces (`client`, `server`), scripts, Node `>=22`, root dev tooling                                                  |
| [`client/package.json`](../client/package.json), [`server/package.json`](../server/package.json)                                                                   | Workspace scripts and dependencies                                                                                           |
| [`client/vite.config.ts`](../client/vite.config.ts)                                                                                                                | Port `5173`, `/api` proxy to `http://localhost:4000`, preview port `4173`, `@shared` and `@` aliases, React/Tailwind plugins |
| [`server/vitest.config.ts`](../server/vitest.config.ts)                                                                                                            | Test include pattern, setup file, single-worker execution, timeouts                                                          |
| [`vercel.json`](../vercel.json)                                                                                                                                    | Framework `null`, install/build commands, `client/dist` output, API and SPA rewrites                                         |
| [`tsconfig.base.json`](../tsconfig.base.json), [`client/tsconfig.json`](../client/tsconfig.json), [`server/tsconfig.json`](../server/tsconfig.json)                | TypeScript configuration for both workspaces                                                                                 |
| [`eslint.config.js`](../eslint.config.js), [`.prettierrc.json`](../.prettierrc.json), [`.prettierignore`](../.prettierignore), [`.editorconfig`](../.editorconfig) | Lint and formatting rules                                                                                                    |
| [`client/index.html`](../client/index.html)                                                                                                                        | App shell, SEO/social metadata, pre-hydration theme/language setup                                                           |
| [`server/sql/schema.sql`](../server/sql/schema.sql)                                                                                                                | PostgreSQL tables and indexes                                                                                                |
| [`opencode.json`](../opencode.json), [`.vscode/extensions.json`](../.vscode/extensions.json)                                                                       | Editor/LSP tooling configuration                                                                                             |

## Application settings and local storage

| Key                 | Kind                                         | Where it is read/written                                                                                                   |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `roadatlas.theme`   | User preference: `dark`, `light`, or `ocean` | [`client/src/theme/ThemeProvider.tsx`](../client/src/theme/ThemeProvider.tsx), [`client/index.html`](../client/index.html) |
| `roadatlas.lang`    | User preference: `en` or `ar`; `ar` sets RTL | [`client/src/i18n/index.ts`](../client/src/i18n/index.ts), [`client/index.html`](../client/index.html)                     |
| `roadatlas_session` | httpOnly JWT cookie, seven-day lifetime      | [`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts)                                                        |

User settings also include domain values stored in PostgreSQL rather than the
browser: `visibility` (`public` / `private`), `Roadmap.kind` (`hub` / `tech` /
`pipeline`), `Step.stage` (`idea` / `design` / `build` / `ship` / `done`),
`Progress.status`, and localized `{ en, ar? }` text. The full contracts are in
[`shared/src/index.ts`](../shared/src/index.ts).

## Script flags and legacy variables

The shell scripts carry flags rather than a manifest config:

| Script                                                                          | Flags / variables                                                                     | Purpose                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`server/scripts/backup.mjs`](../server/scripts/backup.mjs)                     | `--out`                                                                               | Write an EJSON dump to a chosen path                    |
| [`server/scripts/restore.mjs`](../server/scripts/restore.mjs)                   | `--file`, `--drop`, `--yes`                                                           | Restore a dump; `--drop` requires `--yes`               |
| [`server/scripts/create-user.mjs`](../server/scripts/create-user.mjs)           | `--email`, `--display-name`, `USER_EMAIL`, `USER_DISPLAY_NAME`, `USER_PASSWORD`       | Provision an owner; `--password` is explicitly rejected |
| [`scripts/push-db-to-atlas.sh`](../scripts/push-db-to-atlas.sh)                 | `ATLAS_URI`, `LOCAL_URI`, `TARGET_DB`, `ROADATLAS_MONGO_CONTAINER`, `--drop`, `--yes` | Copy a local MongoDB database to a remote host          |
| [`scripts/add-hub.mjs`](../scripts/add-hub.mjs)                                 | `MONGODB_URI`, [`scripts/hub-content.json`](../scripts/hub-content.json)              | Upsert seed hub content by `legacyKey`                  |
| [`server/scripts/import-portfolio.mjs`](../server/scripts/import-portfolio.mjs) | `MONGODB_URI`, `ADMIN_EMAIL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`           | Import portfolio data from a Supabase source            |

## Known gaps

- These legacy scripts import `mongoose` and/or `bson` and read `MONGODB_URI`,
  but neither package is declared in [`server/package.json`](../server/package.json)
  and the running API reads `DATABASE_URL` with `pg`. They are not aligned with
  the current persistence layer; see [architecture.md](./architecture.md#storage-and-integration-boundaries).
- `server/.env.example` still documents `MONGODB_URI` instead of `DATABASE_URL`.
  [`server/src/config/env.ts`](../server/src/config/env.ts) is the authoritative
  list of variables the API validates.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` appear only in the legacy
  import script; they are not used by the client or server runtime.
- No feature-flag system is present. Themes, languages, visibility, and stages
  are enum values in code and shared types.

## Sources

- [`server/src/config/env.ts`](../server/src/config/env.ts), [`server/.env.example`](../server/.env.example), [`client/.env.example`](../client/.env.example)
- [`client/src/lib/api.ts`](../client/src/lib/api.ts), [`client/src/i18n/index.ts`](../client/src/i18n/index.ts), [`client/src/theme/ThemeProvider.tsx`](../client/src/theme/ThemeProvider.tsx)
- [`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts), [`shared/src/index.ts`](../shared/src/index.ts), [`vercel.json`](../vercel.json)
