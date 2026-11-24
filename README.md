# RoadAtlas

A fun, animated, documentation-first web app to **showcase, follow, track and revisit**
tech roadmaps: branching hub roadmaps, per-tech roadmaps, multi-metric **curves**
with written findings, side-by-side **comparisons**, and project **pipelines**.

## Stack

- **client/** — Vite + React + TypeScript, React Router, Tailwind,
  React Flow (`@xyflow/react`), TanStack Query, i18next
- **server/** — Express + TypeScript + `pg`, JWT auth (httpOnly cookie), zod validation
- **shared/** — shared TypeScript types
- **DB** — PostgreSQL via `DATABASE_URL` (schema in `server/sql/schema.sql`)

Older briefs and ADRs describe a MongoDB/Mongoose stack; the running API uses
PostgreSQL. [Architecture](./docs/architecture.md) documents the implementation
in this repository.

## TDAIM foundation

RoadAtlas follows **TDAIM** (Theme- and Direction-Aware Incremental Model, practiced through
modular development): theme and direction awareness are day-one concerns.

- **Themes** — `dark` (default), `light` and `ocean` via semantic CSS variables + a `data-theme`
  attribute, exposed to Tailwind through `@theme inline`. Use tokens (`bg-base`, `bg-surface`,
  `text-fg-primary`, `border-border-default`, `text-primary`, …) — never hard-coded colors.
- **Direction** — English + Arabic with RTL/LTR driven by logical CSS properties
  (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`). Toggle in the header; persisted to localStorage.

See [`docs/`](./docs/README.md) for the [product vision and delivery plan](./docs/product-vision-and-delivery.md),
ADRs, page specs, and the founding [research conversation](./docs/research/react-native-vs-kmp.md).

![RoadAtlas product cover](client/public/og-image.png)

## Visual identity

RoadAtlas has three distinct appearance modes: rose-accented **dark**, berry and
violet **light**, and aqua-accented **ocean**. Direction-aware layouts support
English and Arabic without changing those color roles.

| Mode  | Canvas    | Primary   | Secondary |
| ----- | --------- | --------- | --------- |
| Dark  | `#0a0e27` | `#ffaecb` | `#2dd4e8` |
| Light | `#eef1fb` | `#84082f` | `#0590a6` |
| Ocean | `#031a20` | `#6ce3cd` | `#5aa9e6` |

The image is promotional cover artwork, not a live map screenshot. See the
[visual identity guide](docs/visual-identity.md) and canonical tokens in
[`client/src/index.css`](client/src/index.css).

## Getting started

```bash
npm install

# configure the server
cp server/.env.example server/.env
# then set DATABASE_URL (PostgreSQL) plus auth values in server/.env

npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000/api/health

The API boots without `DATABASE_URL`; health reports `database: "disabled"` and
data routes answer 503. See [operations](./docs/operations.md) and
[configuration](./docs/configuration.md).

## Scripts

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Run server + client together        |
| `npm run dev:server`   | Run the API in watch mode           |
| `npm run dev:client`   | Run the Vite dev server             |
| `npm run build`        | Build client and server             |
| `npm run typecheck`    | Type-check both packages            |
| `npm run lint`         | ESLint                              |
| `npm test`             | Run the server Vitest suite         |
| `npm run format:check` | Check formatting with Prettier      |
| `npm run format`       | Write formatted files with Prettier |

## Operations

Production setup, structured logs/request ids, health, provisioning, and backup/restore are covered in
[`docs/operations.md`](./docs/operations.md).

## Notes

- The local `dev/` folder is git-ignored (scratch/experiments).
- Rotate `JWT_SECRET` and store the bcrypt `ADMIN_PASSWORD_HASH` (never the plaintext).
- Docs: [`docs/README.md`](./docs/README.md) — decisions
  ([0001](./docs/decisions/0001-project-scope.md), [0002](./docs/decisions/0002-tdaim-frontend-foundation.md),
  [0003](./docs/decisions/0003-information-architecture.md), [0004](./docs/decisions/0004-domain-model-v2.md)),
  [page specs](./docs/pages/README.md) and [research](./docs/research/react-native-vs-kmp.md).
- Local `dev/` scratch docs are git-ignored and are not part of the maintained
  documentation set.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Omar Khaled.
