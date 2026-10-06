# Proposal

## Why

A first-time user lands in a three-pane shell with no orientation: the rail, the
sidebar, the editor, the right panel, and the status bar are all present, but
nothing explains what each one is for. The keyboard-shortcuts reference teaches
keys, not the layout, and it lives collapsed at the bottom of the right panel
where a new user has no reason to open it. The folder rail has had no help
affordance since `move-help-to-right-panel` removed the `?` button from the
status bar. A short guided tour is the missing first-run explanation, and the
rail's unused bottom edge is where its entry point belongs.

## What Changes

- The folder rail gains a bottom-anchored, square `?` tour control, on wide
  viewports only. It is the rail's last control, held to the rail's bottom edge
  however many folders are listed.
- Activating it opens an app tour: a modal overlay that walks the shell's
  regions in steps — the rail, the sidebar, the editor area, the right panel,
  and the status bar. Each step names a region and explains what it holds.
- The tour is a step sequence with Back, Next, and Skip; Escape and the close
  control end it. Opening it moves focus into it and closing it restores the
  focus that opened it. It traps focus while open and requires dismissal.
- The tour is presentation only: it changes no page, writes no file, and stores
  nothing. It launches on demand and never on its own; there is no first-run
  marker.
- The tour is not shown at or below the compact breakpoint. Compact shows one
  view at a time, and the spec has showing a view push a history entry, so a
  tour that flipped views to reach every region would flood the back stack. The
  rail shows no tour control on compact.
- No new dependency. The overlay reuses the search spotlight's scrim, ivory card,
  whisper shadow, and focus contract; the spotlight cut-out is a single
  transparent element with a spread shadow.

## Capabilities

### New Capabilities

None. The tour is shell chrome that points at the shell, so it belongs with the
workspace rather than a capability of its own.

### Modified Capabilities

- `workspace`: the folder rail gains a bottom-anchored `?` tour control on wide
  viewports, and a new requirement covers the tour's behavior — the modal
  overlay, its steps over the shell's regions, its navigation and dismissal, its
  focus contract, and its wide-only, session-only, write-nothing scope.

## Impact

- **New**: `src/components/Tour.tsx`, `src/components/Tour.module.css`,
  `src/tour/steps.ts` (the step content and target names).
- **Changed**: `src/components/FolderRail.tsx` + `.module.css` (the `?` control
  and an optional `onTour` callback, the same optional-callback shape `onAdd`
  uses), `src/App.tsx` (tour open state, the rail callback, rendering the tour,
  and closing the tour when the search chord opens the spotlight), and
  `data-tour` hooks on the boxed shell regions the steps point at
  (`#folder-rail`, `#sidebar-pane`, the editor's `<main>`, `#meta-panel`, the
  status bar's `<footer>`).
- **Tests**: `src/components/Tour.test.tsx` (step advance, Back, Skip, Escape,
  missing target, focus return), `src/components/FolderRail.test.tsx` (the
  control and its callback), `src/App.integration.test.tsx` (opening and closing
  the tour, and the search chord closing it), and a Playwright check that the
  spotlight tracks a region in a real browser (jsdom has no layout).
- **Version**: a minor bump in `package.json` (a new user-facing surface).
- **Relations to prior decisions**: no new ADR. ADR-0005 (keep the UI small) and
  ADR-0006 (scope guardrails) frame this as a small shell affordance, not a
  second surface; ADR-0011's design language already sanctions the whisper
  shadow for floating surfaces. The change reverses part of
  `move-help-to-right-panel` by adding a modal back, but for onboarding rather
  than reference content; `design.md` records that reasoning and the rejected
  alternatives (a third-party tour library, a non-blocking coachmark, and a
  first-run marker under `.folio/`).
- **Not affected**: no vault, index, parser, storage, or editor change. Markdown
  stays canonical; nothing here touches the on-disk contract, and the tour never
  sits on the typing path.

## Non-goals

- No first-run auto-launch and no "seen" marker. The tour runs only when the
  user asks for it; a `.folio/` first-run file (ADR-0015) is a separate change if
  it is ever wanted.
- No tour on the compact shell. The control and the tour are wide-only.
- No third-party tour library, and no new dependency of any kind.
- No interactive steps: the tour describes the shell and does not click, open,
  or change anything on the user's behalf.
- No change to the keyboard-shortcuts reference, its content, or its place in
  the right panel.
- No coachmark, beacon, tooltip, or persistent help chrome on any other surface.
- No theming, preferences, or per-user tour state.
- No backend, no database, no block-based document model.
