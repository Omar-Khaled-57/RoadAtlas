# RoadAtlas

A fun, animated, documentation-first web app to **showcase, follow, track and revisit**
tech roadmaps: branching hub roadmaps, per-tech roadmaps, multi-metric **curves**
with written findings, side-by-side **comparisons**, and project **pipelines**.

## Stack

- **client/** — Vite + React + TypeScript, React Router, Tailwind,
  React Flow (`@xyflow/react`), TanStack Query, i18next
- **server/** — Express + TypeScript + Mongoose, JWT auth (httpOnly cookie), zod validation
- **shared/** — shared TypeScript types
- **DB** — MongoDB Atlas (free tier)

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

## Getting started

```bash
npm install

# configure the server
cp server/.env.example server/.env
# then edit server/.env (MongoDB URI + admin credentials)

npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000/api/health

The API boots even without a `MONGODB_URI` set (Phase 1 stub) so the scaffold runs offline.

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Run server + client together |
| `npm run build`     | Build client and server      |
| `npm run typecheck` | Type-check both packages     |
| `npm run lint`      | ESLint                       |
| `npm run format`    | Prettier write               |

## Notes

- The local `dev/` folder is git-ignored (scratch/experiments).
- Rotate `JWT_SECRET` and store the bcrypt `ADMIN_PASSWORD_HASH` (never the plaintext).
- Docs: [`docs/README.md`](./docs/README.md) — decisions
  ([0001](./docs/decisions/0001-project-scope.md), [0002](./docs/decisions/0002-tdaim-frontend-foundation.md),
  [0003](./docs/decisions/0003-information-architecture.md), [0004](./docs/decisions/0004-domain-model-v2.md)),
  [page specs](./docs/pages/README.md) and [research](./docs/research/react-native-vs-kmp.md).
