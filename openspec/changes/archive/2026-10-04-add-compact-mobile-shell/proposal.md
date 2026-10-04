# Proposal

## Why

Folio's shell is a fixed six-column grid with no breakpoints. The fixed tracks —
16px strip, 56px rail, 264px sidebar, 280px panel, 16px strip — total 632px
before the editor gets a single pixel, so at a phone width the workspace
overflows the viewport and the app is unusable, not merely cramped.

Until recently that did not matter: the File System Access directory picker, on
which the whole vault model rests (ADR-0002), had no mobile implementation. It
shipped in **Chrome for Android 132**, so the folder-as-database model now works
on a phone at all — and nothing in the app takes advantage of it. A
phone-sized, note-taking-first composition turns a vault the user already has
into something usable in hand, without touching the desktop shell and without
adding a single capability to the vault.

## What Changes

- **A compact composition of the existing shell**, at or below one width
  breakpoint. The content area shows exactly one view at a time — the
  navigation view (folder rail + sidebar), the editor view, or the meta view
  (right panel) — drawn from the same panes and the same props. No second
  component tree, no route, no second shell.
- **The status bar becomes the compact app bar.** It keeps its place at the
  bottom of the shell and its existing controls (Back, Forward, Today, the
  page-name crumb), and gains two view controls at its two ends: navigation on
  the leading edge, meta on the trailing edge. Nothing is added above the panes,
  so the "no header band" rule holds in both compositions.
- **Opening a view pushes a history entry**, so Android's Back gesture and the
  hardware Back button return to the editor instead of leaving the app, and the
  view controls toggle the view back. The active view is session-only and is
  written nowhere.
- **A landing rule**: with no open page the app shows the navigation view; with
  a page open it shows the editor view. Selecting a row from the navigation view
  shows the editor view.
- **The wide composition is untouched**: the foldable three-pane layout, the
  two collapse strips, folding as one left unit and one right unit, session-only
  fold state, and the keyboard-first interactions all behave exactly as they do
  today. The compact composition has no strips and does not fold.
- **Mobile platform setup**: `viewport-fit=cover` and
  `interactive-widget=resizes-content` on the viewport meta, a `100dvh` shell,
  safe-area insets on the app bar, and touch-sized controls.
- **`DESIGN.md` gains a touch-target and safe-area rule**, since it has none
  today and the compact controls are the first touch-sized surface in the app.
- **ADR-0005 is amplified** with the compact composition and the alternatives
  rejected here; **ADR-0002 records** that Chrome for Android 132+ now satisfies
  Chromium-first.

## Capabilities

### New Capabilities

None. This changes one surface — the shell — and introduces no capability the
vault does not already have.

### Modified Capabilities

- `workspace`: the composition requirement is scoped to wide viewports and a
  compact composition is added in its place; the status bar gains the compact
  view controls; the page-name reveal shows the navigation view on compact
  instead of unfolding a folded pane.

## Non-goals

- **No iOS, iPadOS, or any Safari or Firefox target.** Neither ships the
  directory picker; there is nothing to support and no fallback to build. The
  existing browser-requirement screen already states this and is unchanged.
- **No new vault behavior.** No new page, journal, board, file, search,
  reference, favorite, or import capability. Markdown on disk is unchanged
  (ADR-0001), and every read and write still goes through `VaultStorage`
  (ADR-0003).
- **No gesture opens a view.** Both screen edges belong to Chrome Android
  (swipe-in from the left is Back, from the right is Forward) and cannot be
  claimed from the page. Opening is always a control; Back is the dismiss
  gesture, which the history entry makes it.
- **No change to the desktop composition.** The wide layout, its strips,
  folding, session-only fold state, and the keyboard-first interactions stay
  exactly as they are. Compact behavior is additive and gated by one media
  condition.
- **No change to boards, presentations, the row context menu, favorites, or the
  Logseq import.** Chromium for Android fires `contextmenu` on long-press, so
  the row menu — and therefore Favorite and Present — already works on touch
  with no new code, and boards and the import keep their current behavior.
  Hiding them would be new code and a new state, not a saving.
- **No persistence.** The active view is never written to the vault, to
  IndexedDB, or to `localStorage`, matching the fold state's session-only rule.
- **No drag-and-drop work.** HTML5 drag-and-drop does not fire on touch, so the
  sidebar's row drag is inert on a phone. That is a pre-existing limitation of
  the gesture, not a compact-composition behavior, and fixing it is out of
  scope.

## Impact

- **`src/index.css`** — the compact composition: a single-column workspace,
  one view shown at a time, and the app bar's compact layout.
- **`src/App.tsx`** — the active-view state, the history entry that Back closes,
  the landing rule, and the two new status-bar controls.
- **`src/components/PaneCollapseToggle`** — unused on compact; the strips are
  hidden by the media condition rather than removed.
- **`src/components/StatusBar`** — two optional view controls and a compact
  variant of its layout.
- **`index.html`** — viewport meta gains `viewport-fit=cover` and
  `interactive-widget=resizes-content`.
- **`DESIGN.md`** — a new touch-target and safe-area rule.
- **`adr/0005-keep-ui-small-three-pane-layout.md`** and
  **`adr/0002-chromium-first-pwa-file-system-access.md`** — amplified as above.
- **No dependency added**, no build change, and no change to the entry chunk:
  the compact composition is CSS plus a class flip.
- **Keystroke path: nothing.** Opening a view changes a class and pushes a
  history entry; it re-parses nothing, re-serializes nothing, reads no file, and
  allocates nothing per item. The editor-responsiveness budget is unaffected.
