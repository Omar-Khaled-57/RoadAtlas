# RoadAtlas — Public Content, Owner Editing, and Map Hub Plan

**Status:** Revised implementation plan; approved direction, implementation in progress.  
**Prepared:** 2026-10-23 · **Revised:** 2026-10-24

## 1. Approved model

RoadAtlas is a public atlas. Visitors browse and read without an account. The
site has **one owner account**; signing in turns the same public pages into an
editor. There is no administrator role, separate dashboard, or public sign-up.

Confirmed decisions:

1. **Public by default.** Every item—roadmaps, steps, comparisons, curves,
   notes, decisions, focus content—is publicly readable by default. The owner
   can turn visibility off per item. Visibility is not implied by URL length or
   login obscurity; the server enforces it.
2. **One account, the owner.** Authentication is the edit switch. The account is
   provisioned by the operator and the provisioning path refuses a second
   account. No `isAdmin` flag, role hierarchy, or admin middleware is added.
3. **Progress is private.** Public pages do not show percentages or any derived
   status that reveals personal progress. The signed-in owner sees real
   progress. Anonymous APIs never return progress records.

The existing `ownerId` and `visibility` fields remain so the data model can
support multiple users later, but multi-user behavior is out of scope now.

## 2. Non-negotiable constraints

- TDAIM: semantic theme tokens only; no hard-coded colours.
- All user-facing text goes through `client/src/i18n/locales/{en,ar}.json`;
  English and Arabic stay in parity.
- RTL uses logical CSS properties.
- WCAG AA, keyboard access, visible focus, and reduced-motion support.
- The login entry is hidden from normal navigation. The `OMR` activation
  sequence is a convenience, **not** authorization.
- Every mutation requires a valid owner session server-side. Client-side hiding
  is never treated as security.
- Strict validation; ownership and `ownerId` are always server-derived.
- Follow `dev/audit-protocol.md`: implement one stage at a time, then
  re-audit, regress, and validate before advancing.

## 3. Current-state audit

### 3.1 Server

- [`server/src/middleware/auth.ts`](../server/src/middleware/auth.ts) issues an
  HTTP-only `roadatlas_session` JWT with a seven-day lifetime, resolves the
  session against the `User` collection when persistence is available, and
  exposes `requireAuth`. There is no role check.
- The same middleware bootstraps a user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` when
  configured. Despite the names, this creates an ordinary user.
- [`server/src/routes/auth.ts`](../server/src/routes/auth.ts) supports session,
  login, and logout. Logout clears the cookie but does not revoke a copied JWT.
- [`server/src/models/index.ts`](../server/src/models/index.ts) defines `User`,
  `Roadmap`, `Step`, `Progress`, `Comparison`, `Metric`, `Note`,
  `DecisionRecord`, and `Focus`.
- `visibilityField` currently defaults to `private`; the approved default is
  `public`.
- `Progress` has no unique `(ownerId, stepId)` index.
- `Roadmap.parentId` defines hierarchy. There is no separate connection model.
- Roadmap creation accepts nested steps but writes them separately; PATCH
  accepts `steps` but does not apply them; delete does not check for children.
- Comparison criterion IDs are optional in validation but required by the
  model. Comparison seed weights use `1..3` while validation allows `0..1`.
- Link validation accepts any URL rather than HTTP(S) only.
- `server/scripts/create-user.mjs` accepts a password argument and can create
  any number of users.
- There is no migration ledger or seed-import command.

### 3.2 Client

- [`client/src/pages/MapPage.tsx`](../client/src/pages/MapPage.tsx) renders the
  graph from `seedRoadmaps` plus seed progress. It has no persisted reads and no
  editing.
- `RoadmapsPage`, `PipelinesPage`, `PipelineDetailPage`, `ComparePage`,
  `CurvesPage`, `SearchPage`, and homepage summaries are seed-driven.
- `OwnerRoadmaps` and `OwnerRoadmapDetail` already provide authenticated
  roadmap/step/progress CRUD, but they are an owner panel rather than the public
  pages becoming editable.
- Notes and Decisions have persisted client CRUD. Their page specs still say
  “coming soon”.
- Comparison and Metric server routes exist; client APIs expose lists but not
  full CRUD.
- [`client/src/components/AppShell.tsx`](../client/src/components/AppShell.tsx)
  shows Login in the public navigation.
- Seeds contain fields the schema cannot store, including roadmap
  `prerequisites`/`topics`/`paused`, step `done`/`note`, comparison
  `chosenTechId`/`revisitAt`/`evidence`, technology profiles, and metric
  `techId`/`evidence`.
- Seed IDs are readable strings; persisted relationships use ObjectIds.
- There is no client test runner.

### 3.3 Baseline

On 2026-10-23 the repository passed `npm test` (23 tests), `npm run typecheck`,
`npm run lint`, and `npm run build`. The only uncommitted file at revision
`3be7aaf` was this plan.

## 4. Target behavior

### Visitor

- Reads all public roadmaps, steps, pipelines, comparisons, curves, notes,
  decisions, and focus content.
- Sees no login link, edit control, draft, personal progress, or percentage.
- A direct `/login` URL still renders the fallback form.
- If a public roadmap has a private ancestor, the private ancestor and edge are
  omitted; the public child remains reachable only if it is itself public.

### Owner

- Uses the hidden `OMR` sequence or `/login` to authenticate.
- Once authenticated sees edit controls in context, a logout control, and real
  progress/percentages.
- Can toggle visibility per item, create/edit/delete roadmaps and steps, connect
  nodes via `parentId`, and manage comparisons, metrics, notes, and decisions.
- Logout hides all editing immediately and revokes the server session.

## 5. Implementation stages

Each stage ends with relevant tests, `npm run typecheck`, `npm run lint`, and a
focused re-audit. The audit log records findings, severity, fix, and validation.

### Stage 1 — Owner session and hidden activation

- Add `sessionVersion` to `User`; include it in the signed JWT and verify it on
  every session resolution. Logout increments the version and clears the cookie.
- Keep the seven-day cookie but reject tokens whose version no longer matches.
- Remove the admin bootstrap from env or explicitly document it as the single
  owner bootstrap; do not create additional users.
- Change provisioning to require a hidden prompt or environment secret, refuse
  when any user already exists, and validate password length ≥ 12.
- Treat every authenticated user as the owner for now, because the provisioning
  path guarantees exactly one user. Keep checks centralized so a future role
  model can replace this.
- Add `fun` in the client shell: one global keydown listener, ignore editable
  targets and modifiers, keep only the last three eligible uppercase
  characters, never log the buffer, open the login dialog on `OMR`.
- Remove the visible Login link; keep `/login`; add contextual logout only when
  signed in.
- Tests: session revocation, login/logout, second-account rejection,
  unauthenticated mutation rejection, and `fun` buffer/editable exclusions.

### Stage 2 — Public defaults and schema reconciliation

- Change `visibilityField` default to `public`; make create/update validation
  defaults public. Add an idempotent migration to set current records public
  unless the owner explicitly opted out.
- Add missing content fields needed to preserve the existing public atlas:
  roadmap `prerequisites`, `topics`, `paused`; step note/completion content only
  where it is public, not personal progress; comparison `chosenTechId`,
  `revisitAt`, `evidence`; metric `techId`, `evidence`.
- Add a minimal technology profile entity only if Compare still needs editable
  profile fields; otherwise treat profiles as fixed copy.
- Align comparison weights to `0..1`; migrate seed weights by dividing by three.
- Generate criterion IDs server-side; require HTTP(S) links.
- Add revisions and parent validation: parent exists, no self/cycle, allowed
  kinds, and same logical dataset.
- Make nested step creation consistent and reject PATCH `steps` or implement it
  deliberately; block deleting parents with children until reparenting is chosen.
- Add a digest-safe seed import command mapping stable legacy IDs to ObjectIds
  and making a second run a no-op.
- Tests: visibility defaults, anonymous progress exclusion, cycle rejection,
  link schemes, revision conflicts, duplicate progress, and seed idempotency.

### Stage 3 — Public reads

- Add a public map read model: public roadmap nodes plus safe step counts and
  ordered public steps. Do not include `ownerId` or progress.
- Add public hooks for map, catalog, pipelines, comparisons, curves, notes,
  decisions, and search data. Keep owner hooks separate.
- Cut pages over from seeds, preserving loading, empty, error, and offline
  states.
- Keep the computed graph layout; only data becomes persisted.
- Hide percentages and progress-derived statuses from anonymous responses and
  UI.
- Tests: anonymous DTO shape, private-item omission, private ancestor handling,
  and public child behavior.

### Stage 4 — Owner editing in context

- Add create/edit/delete/connect controls to the Map Hub and catalog, visible
  only with a valid owner session.
- Add visibility toggles per item; public is the default and the owner can turn
  it off.
- Preserve drafts on failed saves; show validation, conflict, and network
  errors; invalidate all affected queries after success.
- Add progress controls only in owner mode; never render them in public HTML.
- Add accessible dialogs, focus management, RTL-safe layout, and keyboard labels.
- Tests: edit/refresh persistence, visibility toggle, conflict handling, and
  logout immediately hiding controls.

### Stage 5 — Remaining content and docs

- Add comparison/curve client CRUD if those remain owner-managed.
- Replace remaining seed summaries with persisted reads or clearly labelled
  static design copy.
- Update Knowledge, Decisions, Search, Map, Operations, ADR 0004, and this plan
  to match implemented behavior.
- Add migration/runbook documentation and backup/restore verification steps.

### Stage 6 — Verification and release

- Run migration retry, restore, session revocation, anonymous read, owner edit,
  and logout flows.
- Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and
  `npm run format`.
- Web audit: axe, Lighthouse across public and authenticated routes, themes,
  RTL, reduced motion, slow-network behavior.
- Security audit: cookie flags, CSRF, rate limits, secret handling, headers,
  public DTO redaction, bundle scan, dependency audit.
- Final blind re-audit per the protocol; no Critical/High findings remain.

## 6. Migration and deployment order

1. Take and verify a protected backup.
2. Deploy additive schema fields (`sessionVersion`, content fields, revisions)
   with backward-compatible defaults.
3. Run the visibility backfill to public unless an explicit opt-out is recorded.
4. Deduplicate progress, then create the unique index.
5. Import seeds once if approved; preserve legacy-ID mapping and do not
   overwrite edited content on later runs.
6. Deploy public read APIs and client cutover.
7. Verify anonymous and owner flows, then enable editing.

Migrations must be ordered, idempotent, resumable, and recorded in a ledger.
Do not claim atomicity when the deployed MongoDB topology does not support it.

## 7. Security requirements

- `ownerId` and session version are server-derived; never accepted from clients.
- Anonymous responses omit `ownerId`, progress, drafts, and private items.
- Cookies: HTTP-only, `SameSite=Lax`, `Secure` in production, scoped path.
- Mutations remain behind CSRF protection and authentication.
- Login and mutation endpoints are rate-limited; failures are generic.
- No credentials in command-line arguments, logs, analytics, or the client
  bundle. Hidden `OMR` input is never logged or persisted.
- Public URLs are scheme-limited and rendered safely.
- Logout revokes server-side authorization, not just the browser cookie.
- Single-owner provisioning refuses a second account.
- Errors do not reveal whether an email exists or whether a private item exists.

## 8. Acceptance tests

- Anonymous Map Hub shows public content, no login link, no edit controls, no
  percentages, and no personal progress.
- Direct `/login` works; `OMR` opens the dialog without creating a session.
- Typing `OMR` in inputs, textareas, selects, or content-editable regions does
  not activate the dialog; modifiers do not trigger it.
- A valid owner session reveals editing; invalid/expired/revoked sessions do not.
- Logout hides editing immediately and makes the old token unusable.
- The owner can create, edit, delete, reparent, and toggle visibility; invalid
  relationships and stale revisions fail safely without losing drafts.
- Public child/private parent behavior matches the documented policy.
- Reload preserves persisted content and relationships.
- Seed import is repeatable and does not overwrite edited records.
- Progress has at most one record per owner/step and is absent from public APIs.
- All gates pass; accessibility and Lighthouse checks meet the protocol targets.

## 9. Open decisions

1. **Seed content:** import all current demo content as public owner content, or
   start empty? Recommended: import once, with stable IDs and public visibility.
2. **Parent/child kinds:** confirm which roadmap kinds may parent which. Until
   confirmed, allow same-kind parentage and reject cross-kind parentage.
3. **Deletion:** block parents with children until reparenting is confirmed;
   archive instead of hard-delete only if the product needs it.
4. **Revision protocol:** use a numeric `revision` in payloads and return `409`
   with the current revision on conflict.
5. **Technology profiles:** persist only if Compare profile fields remain
   editable; otherwise keep them as application copy.

### Recommended defaults

- Import all current public demo content once.
- Allow parent/child within the same kind; reject cycles and cross-kind links.
- Block parent deletion while children exist.
- Use numeric revision fields with `409 Conflict`.
- Keep technology profiles as fixed copy for this release.
