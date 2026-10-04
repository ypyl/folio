# Design

## Context

See `proposal.md` — Why. The facts that shape the approach:

- The shell is `.app-shell` (grid rows: workspace, status bar) containing
  `.workspace`, a six-column grid: strip, rail, sidebar, editor, panel, strip.
  Each pane's width comes from a token (`--rail-w`, `--sidebar-w`, `--panel-w`)
  with a live `--*-cur` override that the collapse strips zero.
- The app has no breakpoints. `#root` is `100svh`; `.workspace` distributes
  width by grid, and every pane owns its own internal scrolling.
- The editor is CodeMirror 6 mounted in `EditorPane`, keyed by page path. It is
  the only pane whose measured box matters: it re-measures on resize, and its
  undo history and scroll position live in the instance.
- Chrome for Android 132+ ships the File System Access directory picker, so a
  phone can open a vault. iOS and Firefox still cannot.

## Goals / Non-Goals

**Goals**

- One component tree and one set of panes for both compositions. No second
  shell, no router, no duplicated pane components.
- The desktop composition is unchanged, in behavior and in DOM structure where
  a change is avoidable.
- The editor instance survives every view change: no unmount, no zero-sized
  box, no re-measure, no lost undo history.
- Nothing on the keystroke path.

**Non-Goals**

- No gesture layer (see proposal — Non-goals: both screen edges belong to the
  OS).
- No scrim, no backdrop, no focus trap.
- No new persistence of any kind.
- No change to `VaultStorage`, the vault index, search, or the Markdown
  contract. This is a layout change only.

## Decisions

### D1: The compact composition is full-width overlay views over a mounted editor

At or below the breakpoint, the navigation view (rail + sidebar) and the meta
view (right panel) become full-size layers over the workspace's content area,
shown one at a time. The editor stays in the grid, always laid out at its full
content size, underneath.

Alternatives considered:

- **Render only the active view (a true swap).** Simplest DOM, but it unmounts
  `EditorPane`, losing the CodeMirror instance, its undo history, its scroll
  position, and its selection, and paying a fresh mount on every return. Rejected.
- **Zero the editor's grid track while a view is shown.** Reuses the existing
  collapse lever, but gives CodeMirror a zero-width box and forces a re-measure
  on return. Rejected.
- **Overlay with a scrim and a focus trap** (the classic Android drawer). More
  moving parts — z-index, a dismiss target, focus management, background
  scroll-locking — for a phone-width screen where a full-width view reads
  cleanly. Rejected: the app-bar control and Back both dismiss, so the scrim
  buys little here.
- **A view stack with a router and history-driven remounting.** Rejected: the
  app has no router, and remounting is the thing D1 exists to avoid.

Mechanics:

- The rail and sidebar get one wrapper. At wide viewports it is
  `display: contents`, so the grid sees the same children it does today and the
  desktop layout is untouched. On compact it is a real box.
- On compact, that wrapper and the meta panel are absolutely positioned at the
  content area's inset. The inactive one is `display: none`.
- The layer on top is opaque. The editor is hidden with `visibility: hidden`
  while a layer is shown, which takes its controls out of the tab order and the
  accessibility tree while leaving its box, and therefore CodeMirror's
  measurement, exactly where it was. (The `inert` attribute would remove it from
  the tab order too, but it needs an attribute threaded through the pane; the
  stylesheet can express this one.) Showing a view moves focus into it, and
  returning restores focus to the editor.
- The two `PaneCollapseToggle` strips are not rendered on compact. Folding does
  not exist there and the strips' width would be 32px of a phone screen.

### D2: One breakpoint, declared once, with a test that keeps CSS and JS honest

The compact composition applies at `max-width: 640px`.

- `pointer: coarse` alone is rejected: a touchscreen laptop would get a phone
  layout, and the condition is not testable by resizing a window.
- `matchMedia` in JS is needed regardless, because the shown view is React state
  and the landing rule is a decision about which view to select, not a styling
  detail a media query can make.

The width therefore appears twice: in `src/index.css` and as a constant the app
reads. `src/scrollRegions.test.ts` already sets the precedent of asserting a CSS
rule by reading the stylesheet from disk, since jsdom has no layout; the
breakpoint gets the same treatment, so the two declarations cannot drift.

### D3: Showing a view pushes a history entry, and Back pops it

Showing a view other than the editor pushes one `history.pushState` entry.
`popstate` returns to the editor view. The device's Back button and the Back
gesture therefore close the view instead of leaving the app, which is what an
Android user expects and the only way to get swipe-to-dismiss without a gesture
layer.

- The push happens only on a transition into a view, so repeated taps on the
  same control do not stack entries. Activating the shown view's own control
  returns to the editor and pops the entry it pushed.
- The compact view state is React state only. Nothing is written to the vault,
  IndexedDB, or `localStorage`, matching the fold state's session-only rule.
- The search spotlight and the presentation deck keep their own modal behavior
  and push no entries. Back while one is open belongs to it, not to the shell.
- With the on-screen keyboard open, the platform consumes the first Back to
  dismiss the keyboard. The second Back closes the view. Accepted.

### D4: The compact composition hides nothing but the strips

The earlier working list proposed also hiding boards, the row context menu, and
presentations. The code says otherwise, and hiding them would be new code, not a
saving:

- Chromium for Android fires `contextmenu` on long-press, and the row menu is
  already wired to `onContextMenu`, so Favorite and Present work on touch with
  no change.
- Boards and the Logseq import keep their current behavior. Blocking a board on
  compact would mean a new placeholder state to design, test, and explain.

The only thing that genuinely does not work on touch is the row drag
(HTML5 drag-and-drop does not fire), and that is a property of the gesture
rather than of the compact composition, so it stays a known limitation rather
than a spec change.

### D5: The status bar is the compact app bar

The bar keeps its grid row below the workspace and its existing controls, and
gains a navigation view control at its leading edge and a meta view control at
its trailing edge. The two are rendered only on compact, from the same
`useCompact()` the rest of the shell's behavior reads: one component, one JSX
tree, and no view control in the wide DOM at all, rather than two controls
hidden by a stylesheet.

On compact the bar shows the view controls, Back, Forward, Today, and the open
item's name, and drops the breadcrumb path, the folder statistics and the
version — which is why the status-bar requirement scopes those to wide
viewports. The bar is a single non-scrolling row, so its compact content has to
be trimmable rather than wrapped.

### D6: The landing rule covers the first run

With no page open the shell shows the navigation view; with a page open it shows
the editor view. The first-run case (no vault at all) therefore lands on the
navigation view, which is where the rail's add control lives — the brand screen
in the editor view deliberately offers no open-folder button, so landing
anywhere else would strand a new user one tap from the action they need.

### D7: The platform setup is four declarations

- `viewport-fit=cover` and `interactive-widget=resizes-content` on the viewport
  meta. The second is the Chrome-Android mechanism that makes the on-screen
  keyboard shrink the layout viewport instead of covering the editor.
- `#root` moves from `100svh` to `100dvh`. Identical on desktop; correct when
  the URL bar and the keyboard move.
- The app bar pads itself with `env(safe-area-inset-bottom)`, and the shell pads
  left and right with the horizontal insets.
- Every control the compact shell adds is at least 44 by 44 CSS pixels.

## Risks / Trade-offs

- **The vault may not actually work on Android.** → Task 1 is a manual spike on
  a real device: open the picker, pick a Markdown folder, read, edit, save,
  reload, and confirm the stored handle re-grants. If it fails, stop and revisit
  the proposal; no layout work is spent before this is answered.
- **CodeMirror measures a stale box when a view closes.** → The editor never
  changes box: it keeps its grid slot and full content size at all times, and
  the layer is opaque rather than resizing it. Verify with a browser check that
  typing after a nav round-trip keeps the caret and the decorations aligned.
- **The covered editor keeps focus it should have lost.** → `visibility: hidden`
  takes it out of the tab order and the accessibility tree without changing its
  box, and returning to the editor restores focus explicitly. Verified in a real
  browser that a round-trip through the navigation view leaves the editor hidden
  while a layer is shown and focused again when it closes.
- **The breakpoint drifts between CSS and JS.** → The stylesheet-reading test in
  D2 fails if the two declarations disagree.
- **`display: contents` on the navigation wrapper.** → The wrapper carries no
  semantics, so the known accessibility caveat does not apply; confirm with the
  existing accessibility checks that the rail and sidebar are reached in the
  same order as today.
- **History entries interact with the PWA's standalone back behavior.** → The
  push is scoped to the compact shell and only for a view transition; the
  browser check covers Back with the editor shown (which must still leave the
  app) as well as with a view shown (which must close it).
- **The compact bar crowds a 360px screen.** → The dropped path, folder
  statistics and version are what make room; if the remaining controls still do
  not fit at 360px, the next lever is the page name's crumb, not another row.
- **Long pages on a slower CPU.** → ADR-0028 already documented an unresponsive
  page under memory pressure, and the `AGENTS.md` budget is unchanged by this
  work. The compact shell adds nothing to the keystroke path, but a real device
  is the only honest place to confirm the existing behavior holds.

## Migration Plan

No data migration. The change is a stylesheet addition, one wrapper element, one
React state value, and one history push; nothing persisted changes, so a rollback
is a plain revert of the commit with no cleanup on the user's disk.

`adr/0005-keep-ui-small-three-pane-layout.md` is amplified with the compact
composition and the alternatives D1 rejects; `adr/0002` records that Chrome for
Android 132+ satisfies Chromium-first. `DESIGN.md` gains the touch-target and
safe-area rule. The version takes a minor bump for the new user-facing
capability.

## Open Questions

- The exact breakpoint value (640px is a starting point; 600 and 720 are equally
  defensible on current Android hardware). It changes no spec, no approach and no
  task: only the number in two places, which the D2 test keeps in step.
- Whether the compact navigation control should also surface the active vault's
  name. It is a label inside an existing button, addable without touching the
  layout.
