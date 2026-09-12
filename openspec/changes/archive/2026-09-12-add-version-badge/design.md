## Context

See proposal.md — Why. The header brand is already a home button (`Header.tsx`): a `<button>` whose accessible name is "Folio, go home" and whose text is the `FolioMark` plus the title. The app has no runtime version source; `package.json`'s `version` is the only one, and it must survive the Vite build (the bundle is static, there is no backend to ask).

## Goals / Non-Goals

**Goals:**

- The running build's version is visible in the header and always equals `package.json`'s `version`.
- One import site for the version, so a later change (git SHA, build label) has one place to grow.
- No runtime cost, no state, no fetch — the value is fixed at build time.

**Non-Goals:**

- Anything beyond rendering `version` (see proposal.md — Non-goals).
- Deciding the bump policy; that is `AGENTS.md`, not the app.

## Decisions

**1. The version is a static import from `package.json`, re-exported by one module (`src/version.ts`).**

```ts
import { version } from '../package.json'
export const APP_VERSION = version
```

Rationale: `package.json` stays the single source of truth; Vite and vitest both resolve JSON imports through the same pipeline, so the test sees the same value the bundle ships; no runtime fetch and no state to invalidate.

- Rejected: a Vite `define` global (`__APP_VERSION__`). It works, but needs a global `*.d.ts`, a `vite.config.ts` change, and the same define mirrored into the test pipeline, for a value a plain import already resolves.
- Rejected: hardcoding the version in the component. It would drift from `package.json`, which the proposal names as the source.
- Requires `resolveJsonModule: true` in `tsconfig.app.json` (the one config addition).

**2. The badge sits beside the brand as a sibling of the home button, not inside it.**

A plain `<span>` in the header's brand cell, after the button. Rationale: the button is a control with its own name; nesting the badge would absorb version text into that control and make the label a navigation target. As a sibling, the version is informational text, read as text by assistive tech and not clickable.

- Rejected: inside the button (smaller markup, but the version joins the home control's content and its click area).

**3. Render as `v<version>`, styled with Kami tokens.**

`v0.1.0` reads as a version without a label. `--stone`, small size, no hover/focus state — it is not interactive. No new token or color is introduced.

## Risks / Trade-offs

- [Importing `package.json` could bundle the whole file] → import the `version` field only; Rollup tree-shakes the rest, and the file is under 2 KB regardless.
- [`tsc -b` fails without JSON-module support] → `resolveJsonModule: true` is a task item, checked by `npm run build`.
- [A version bump may not show until Vite reloads] → Vite reloads on JSON changes in dev and always rebuilds for production; acceptable for a build label.

## Migration Plan

None. Additive UI; no data, no stored state, nothing to roll back beyond reverting the change.

## Open Questions

None.
