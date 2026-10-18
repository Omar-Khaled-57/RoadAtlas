# Login — `/login`

**Priority:** P0 · **Status:** Spec

## Purpose

The owner's sign-in that gates every **protected operation** on private resources (roadmaps, steps,
criteria, curves, progress, pipelines). Publicly visible resources can be read without signing in;
private reads and all mutations require authorization. The server derives the owner from the session —
never from a client-supplied id (research §3 · [0004](../decisions/0004-domain-model-v2.md)).

## Data needs

`User` / owner identity · auth session (JWT in an httpOnly cookie — [0001](../decisions/0001-project-scope.md)).

## Sections

### 1. Header

- **Purpose:** orient the sign-in.
- **Content:** product mark + one-line "owner sign-in" label.
- **Priority:** P0.

### 2. Credential form

- **Purpose:** authenticate the owner.
- **Content:** username/email + password; submit; optional "show/hide password".
- **Interactions:** submit → session cookie; on success redirect to `returnTo` or `/`.
- **States:** default · submitting (disabled + spinner) · **error** (invalid credentials, no detail leak) · success.
- **A11y:** labelled inputs, focus moved to first error, `autocomplete` correct.
- **Priority:** P0.

### 3. Redirect / guard messaging

- **Purpose:** explain why the user was sent here.
- **Content:** "Sign in to edit" banner when a protected route redirected here.
- **Priority:** P1.

## TDAIM notes

- Theme tokens only (no hard-coded colors); En/Ar copy with correct RTL.
- Error text must stay AA in dark + light.

## Notes

- Start with the simplest secure owner authentication that fits the first release; keep identity and
  ownership explicit so adding users later does not require a data migration. Rate limit the endpoint
  (research §3).
