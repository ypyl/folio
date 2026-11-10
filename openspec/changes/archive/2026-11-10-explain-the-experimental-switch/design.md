# Design

## Context

See proposal.md — Why. The relevant current state:

- The rail's bottom group (`src/components/FolderRail.tsx`) holds the
  experimental control and then the tour control, and it is pinned to the rail's
  bottom edge (`position: sticky`).
- The rail scrolls its folder list (`overflow-y: auto`, `overflow-x: hidden`), so
  an absolutely positioned child beside a control is clipped. The rail has no
  transformed ancestor, which is what makes `position: fixed` escape that scroll
  box without a portal — the same technique `RowContextMenu` already uses for the
  sidebar's list.
- Floating surfaces already have one recipe (DESIGN.md rule 4): the ivory fill,
  8px radius, the whisper shadow `0 4px 12px rgba(20, 20, 19, 0.1)`, and no
  border for a pointer-only surface. `RowContextMenu` and `Tour` are the
  precedent.
- `features` is a module of build-time constants. Nothing in the app enumerates
  them, so today a proposal to list gated features has to hand-maintain a second
  list.

## Goals / Non-Goals

**Goals:**

- One description per flag, in the module that owns the flags, with a test that
  fails when they drift.
- A popup that is a renderer of a passed list, so the rail stays presentational.
- Positioning that needs no portal and no resize listener.

**Non-Goals:**

- No click, no focus trap, no dismissal key, no scroll tracking: the tip is
  bound to hover and focus, so it is correct by construction while shown.
- No `title` attribute kept alongside the popup: one description, not two.
- No change to the rail's scroll behavior or the bottom group's stickiness.

## Decisions

**D1 — Descriptions live beside the flags.**
`src/features.ts` exports `ExperimentalFeature = { flag, label, detail }` and
`experimentalFeatures`, one entry per key of `features`. `features.test.ts`
asserts the entry set and the flag set are equal in both directions, so a flag
added without a description fails the suite. Alternative: a separate registry
file (a second list to drift from the flags) or a description in the component
(the rail stops being a renderer, and App would still need to pass state).

**D2 — The rail renders the list it is given.**
`FolderRail` takes `experimental: readonly ExperimentalFeature[]`, defaulting to
empty, and shows no popup when the list is empty. App passes the module's list.
Alternative: import the module inside the rail, which couples a presentational
component to build-time configuration for one label. The cost of the prop is one
line in App, which already imports `features`.

**D3 — `position: fixed` measured from the control, no portal.**
On show, the rail's and the control's `getBoundingClientRect()` give the anchor:
`left = rail.right + 8` (the rail's edge, not the centered control's, so the
panel clears the border), `bottom = window.innerHeight - control.bottom`, so the
panel's bottom edge lines up with the control's and it grows upward, staying
inside the viewport near the rail's bottom. CSS caps the width at
`calc(100vw - 72px)`, which is exactly what remains after the rail and the gap,
so no horizontal clamping code is needed. Alternatives: an absolutely positioned
child (clipped by the rail's scroll box), a portal (unnecessary — no transformed
ancestor), and a resize/reposition listener (the panel closes when the pointer or
focus leaves, which happens before a resize matters).

**D4 — Hover and focus, no click.**
`onPointerEnter`/`onPointerLeave` and `onFocus`/`onBlur` on the button set and
clear one piece of state, and `pointer-events: none` on the panel keeps the
pointer on the button. This is why the popup needs no "not a menu" machinery: it
cannot be clicked, so it never competes with the switch, and a press flips the
switch exactly as before. `aria-describedby` is attached only while shown, with
an id from `useId`, so the control's name never changes.

**D5 — The popup is inside the rail's subtree.**
It renders as the bottom group's last child. Because it is fixed, it escapes the
scroll box; because it uses the existing floating-surface tokens, it reads as a
tooltip rather than a second panel. `z-index: 30` matches the context menu, which
also sits above the sidebar.

## Risks / Trade-offs

- **The measured anchor is stale after a resize while the tip is shown** → the
  tip is bound to a pointer resting on a 40px button or to keyboard focus; a
  resize mid-hover leaves it a few pixels off until the pointer moves, and every
  leave clears it. No observable breakage.
- **A long description line makes the tip wide** → the width is fixed at 232px
  with wrapping, the detail line is 11px `--stone`, and the fixed width caps it.
- **A future feature is added to `features` but described vaguely** → the test
  enforces presence, not quality; the label and detail are one line each, so a
  vague entry is visible in the source diff.
- **`title` removal loses the tooltip in a browser that runs no JS** → the app
  is a JS app; no such state exists.

## Migration Plan

None. The popup is additive, the preference and the gate are untouched, and no
file or stored value changes. Rolling back is reverting the commit.

## Open Questions

None.
