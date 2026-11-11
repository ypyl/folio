# Design

## Context

See `proposal.md` — Why. What shapes the approach:

- The compact shell is a width media query (`COMPACT_QUERY`, 640px) plus a
  `useCompact()` reading in `src/App.tsx`; it renders the same panes the wide
  shell does, stacked as three separately shown layers.
- The landing rule is two lines in `App.tsx`
  (`status === 'restoring' || mainPaneHasItem ? 'editor' : 'nav'`), and the brand
  screen is the editor layer's no-item state, rendered by `EditorPane`.
- The two menus already exist (`RowContextMenu`) and are opened by
  `onContextMenu` on a page row (`Sidebar`) and on a day cell
  (`JournalCalendar`). Nothing else needs to be built for touch beyond opening
  them.
- `DESIGN.md` states the touch rule for the compact app bar and the Journal row
  only, and it forbids a page row from carrying a visible menu trigger
  (`favorites` spec).
- `compact.test.ts` reads every stylesheet from disk and fails if a width media
  query uses anything but the one breakpoint; `tests/e2e/compact-shell.spec.ts`
  asserts the compact composition in a real browser at 390×844.
- The device run (Pixel 9a, Chrome 157, `adb reverse`) established that the
  folder picker, writes, the keyboard shrink, and the safe-area padding already
  work.

## Goals / Non-Goals

**Goals**

- A first run on a phone reaches the brand screen, the demo, and the folder
  picker without guessing.
- Every control a phone shows can be hit with a thumb.
- Every action a phone shows is reachable without a pointer.

**Non-Goals**

- No new view, gesture family, icon, or design token.
- No change to the wide composition, its pointer-sized controls, or its
  right-click menus.
- No board-editor, task-checkbox, drag-and-drop, or presentation redesign.
- No experimental toggle (D6).

## Decisions

### D1: The landing rule follows what is open, and no folder means the brand screen

`landingView` becomes: no folder active → `editor` (whose no-item pane is the
brand screen); a folder active and nothing open → `nav`; an item open →
`editor`. `status === 'restoring'` keeps leading with `editor`, as it does today,
so the brand screen does not flash before a stored page opens.

Why this way: the navigation view is only useful when it has a folder's content to
show. With no folder it is two empty sections plus a rail, while the brand screen
holds the explanation, the demo, and (now) the folder action. The old rule predates
the brand screen's content and was written when the picker's only home was the rail.

Alternatives considered:

- **Keep the nav view as the landing and put the brand copy into it.** Rejected:
  it duplicates the brand screen, splits one screen into two responsive layouts,
  and hides the demo behind a scroll.
- **Add a "home" pseudo-folder to the rail.** Rejected: a folder that is not a
  folder, and it re-introduces a route the app does not have.

### D2: The compact brand screen offers its headline's action

The brand screen gains an `onOpenFolder` prop, rendered as a primary action at
compact only, wired to the same `addFolder()` the rail's add control calls. The
demo keeps its own primary treatment above the breakpoint; at compact the
open-folder action takes the primary style and the demo and import take the
secondary one, because at compact the rail's `+` is not on screen and the
headline reads "Open a folder to begin." Where the browser cannot open folders
the action is not rendered, so the screen still promises nothing it cannot do.

Alternatives considered:

- **Keep the brand static at compact and rely on the status bar's navigation
  control.** Rejected: it makes the first action a hunt through a second view.
- **Put the action above the description.** Rejected: the spec puts the actions
  under the introduction, before supporting detail.

### D3: One touch rule, enforced by targets rather than marks

Every control the compact shell shows gets a 44×44 minimum. Two shapes:

- Controls whose box can grow (`btn-primary`/`btn-secondary`, accordion
  summaries, listing rows, meta rows, calendar cells, month arrows, menu items,
  search rows) grow their own box in a compact media block. Rows go from 33 to 44
  by vertical padding; the calendar cell from 28 to 44, which still fits six rows
  plus its header inside the navigation view's band.
- Controls whose drawn mark must stay small keep the mark and add an invisible hit
  area sized up to the minimum: the rail's controls, the folder entry's 18px close
  badge (whose hit area is the 44px corner the badge sits in), and the Contents
  disclosure's 16px chevron. Each is `.position: relative` already or becomes so;
  the hit area is a `::before` with `inset` and no paint, so nothing about the
  drawing, spacing, or row height changes.

The rule stays a width media query at the one existing breakpoint, not
`pointer: coarse`: the compact shell is width-defined, `compact.test.ts` guards
the single breakpoint, and a phone is the surface this rule is about. A touch
tablet wider than the breakpoint keeps the desktop composition and its
pointer-sized rows, for now — stated as a consequence, not hidden.

### D4: Press-and-hold is the phone's context-menu gesture

A small helper (`src/components/longPress.ts`) returns pointer handlers and
manages one timer:

- `onPointerDown`: if `matchMedia('(pointer: coarse)').matches`, record the point
  and start a 500ms timer.
- `onPointerMove`: a movement past ~8px cancels the timer (a scroll or a drag).
- `onPointerUp` / `onPointerCancel`: cancel the timer.
- The timer fires the caller's `onLongPress(x, y)` and sets a flag that
  `onClickCapture` consumes, so the release that follows does not open the page
  or the day under the menu.

Both call sites pass their existing `openMenu` logic — the same code path a
right-click already takes, so the menu's position, focus, and dismissal are
unchanged. The pointer is read at event time, not at render, so no state and no
re-render is added; the helper touches nothing on the typing path.

Alternatives considered:

- **A visible trigger on each row.** Rejected: the `favorites` spec forbids a
  visible trigger, rows are already one button, and a second control per row
  would complicate every row's accessible name.
- **Rely on the browser's `contextmenu` on long press.** Rejected on evidence: a
  real 900ms touch hold on a row produced `pointerdown`/`pointerup`/`click` and no
  `contextmenu`.
- **A long-press anywhere on a coarse pointer, including the editor.** Rejected:
  the editor needs press-and-hold for text selection and the caret.

### D5: A compact image carries no expand control

The control is hover-revealed by design, and on a phone "expand" means
overflowing the pane and panning sideways. The compact image keeps the fitted
size and the control is not rendered there (CSS hides it; the node view and the
`expanded` state are untouched, so a window resized across the breakpoint keeps
the state it had). The `editing` spec records the exception.

Alternative considered: an always-visible 44px chip on every image at compact.
Rejected: it covers the image's own content, needs its own visibility rule, and
buys a sideways-pan view on a device with no pointer.

### D6: This completes a shipped surface, so it carries no experimental switch

`AGENTS.md` puts new capabilities behind a build flag and the app-level
experimental switch. This change adds no capability: the compact shell shipped
ungated (`add-compact-mobile-shell`), and every item here is that shell's
behavior becoming correct on the device it was built for — a landing route, hit
areas, and one gesture. Gating it would mean restoring the toggle infrastructure
that retired with reminders, shipping a phone UI that is off by default, and
adding a rail control that exists only to switch on hit areas. The rule's intent
is to keep unproven capabilities out of users' way; a phone user needs the
compact shell to work, not to be optional.

### D7: The keystroke path is untouched

Every change is either CSS (computed once per layout), the landing expression
(read at render), or pointer handlers on rows and day cells. No parser, index,
matcher, or editor decoration changes; no new work runs on a keystroke, and no
filesystem access moves. The long-press timer starts on a pointer press, never on
a key.

## Risks / Trade-offs

- **A 44px close target on a 44px folder entry catches taps meant for the
  entry.** → The badge is drawn exactly in that corner and stays on top, which is
  the same contract the 18px badge has on a pointer device; the entry's centre and
  label remain the switch target.
- **A long-press could open the menu on a drag the browser treats as a
  long-press.** → The movement cancel is evaluated on every pointer move with an
  8px threshold, and the gesture only arms on a coarse pointer.
- **The release after the hold could activate the row.** → A capture-phase click
  handler consumes exactly the click that follows the fired timer, then clears the
  flag.
- **Two event sources on the same menu (timer plus a browser-dispatched
  `contextmenu`).** → Both call the same idempotent open state; if both fire, the
  menu opens once at the later point.
- **44px rows show fewer items in a fixed band.** → Intentional: the listing
  scrolls, and a phone's listing is scrolled anyway. The `windowPieces` row stride
  must follow the compact row height or the spacers drift; the e2e scroll checks
  and the listing tests catch a stale stride.
- **The calendar's day grid grows taller than its band on a short phone.** → Six
  rows at 44 plus the header fit the navigation view's band at 390×844 with room;
  the band scrolls only as its existing fallback, and the compact e2e asserts the
  calendar's real height.
- **Moving the search controls to 44 in a 358px dialog crowds the field.** → The
  field is `flex: 1` and shrinks; the dialog keeps its margins, and the input
  remains at least 240px wide at 390px.
- **A toggle on `pointer: coarse` is unverified by jsdom.** → The helper's tests
  stub `matchMedia`; the real behaviour is exercised in the e2e suite with touch
  enabled and on the Pixel.

## Migration Plan

No data migration and nothing persisted changes: the landing view, the expanded
image, and the shown view were already session-only, and no new preference is
written. The version takes a minor bump, since a phone can now run the app. A
rollback is a plain revert.
