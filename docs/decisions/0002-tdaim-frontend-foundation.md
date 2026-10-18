# 0002 — TDAIM frontend foundation (themes + En/Ar + RTL)

**Status:** Accepted · **Date:** 2026-10-15

## Context

RoadAtlas follows **TDAIM** — _Theme- and Direction-Aware Incremental Model_ (named in the
[source conversation](../research/react-native-vs-kmp.md)). The core rule: **choose tools that
support your architecture, rather than adapting your architecture to the tools.** Two concerns are
**day-one, not retrofitted**:

- **Theme awareness** — dark **and** light, via semantic tokens (not hard-coded colors).
- **Direction awareness** — English **and** Arabic, with correct **RTL/LTR** using **logical CSS
  properties** (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `text-align: start`).

Modularity is how TDAIM is practiced: build cohesive feature modules incrementally and keep changes
localized. TDAIM is the project owner's name for this combination of principles, not a claim of an
established industry standard. See the [product vision](../product-vision-and-delivery.md) for the
full principles and delivery expectations.

## Decision

- **Theme tokens as CSS variables**, swapped by a `data-theme="dark|light|ocean"` attribute on
  `<html>`, exposed to Tailwind v4 via `@theme inline` (so utilities are `bg-surface`,
  `text-fg-primary`, `border-border-default`, `text-primary`, …). No color is written directly in
  components.
- **ThemeProvider + `useTheme()`** persist the choice to `localStorage` (`roadatlas.theme`).
- **i18n via `i18next` + `react-i18next`** with `en` / `ar` resource files. Language is persisted
  (`roadatlas.lang`).
- **Direction is derived from language** (`ar` → `rtl`) and applied to `<html dir lang>` on load and
  on every language change.
- **No-FOUC inline script** in `index.html` sets `data-theme` and `dir` before React mounts.
- Layout uses **logical utilities** (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`, `start-*`) so the
  UI mirrors automatically.

## Consequences

- Adding a theme = add a `[data-theme='...']` block of variables.
- Adding a language = add `i18n/locales/<lang>.json` and, if RTL, add it to `RTL_LANGS`.
- New UI must use tokens + logical properties; physical `left/right` and raw hex colors are avoided
  by convention (enforced later via lint rules if desired).
