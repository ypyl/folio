## Why

The running build has no visible identity: nothing in the UI says which version is live, so a user cannot tell whether the app they are looking at is the one they just shipped. Surfacing `package.json`'s `version` in the header makes the running build identifiable at a glance, and gives the new "bump the version every commit" rule visible output.

## What Changes

- The header shows a small version badge beside the Folio brand title, reading `v<version>`, where `<version>` is the `version` field of `package.json`.
- The badge is non-interactive text, renders in every app state (empty state, indexing, and with a vault open), and carries no state: it is fixed at build time and updates with the bundle.
- **BREAKING**: none. This adds a static label; no existing behavior changes.

## Capabilities

### New Capabilities

None. The badge is one label in the existing shell.

### Modified Capabilities

- `ui-shell`: the header requirement gains the version badge — the header SHALL show the app's version, read from `package.json`, as non-interactive text beside the brand in every app state.

## Non-goals

- No build metadata beyond `package.json`'s `version`: no git SHA, build timestamp, or environment label.
- No changelog, release notes, update check, or "new version available" notification.
- No version display anywhere else — not the status bar, not a pane, not an about surface.
- Does not change how or when the version is incremented; that rule lives in `AGENTS.md`, not the app.

## Impact

- New `src/version.ts` (or equivalent build-time constant): exposes `package.json`'s `version` to the app.
- `src/components/Header.tsx` and `Header.module.css`: render and style the badge with Kami tokens (`--stone`, small text).
- `src/components/Header.test.tsx`: assert the badge renders the version.
- Spec: `ui-shell`.
- ADRs: none changed. ADR-0005 (small shell) still holds — one static text node, no new surface; ADR-0001/0004 are untouched (no vault IO, no app state).
