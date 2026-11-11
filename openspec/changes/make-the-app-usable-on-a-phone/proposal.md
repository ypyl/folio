# Proposal

## Why

The compact shell exists and renders on a phone, but a real Pixel 9a running the
app over `adb reverse` shows it is not yet usable there. Three things fail, and
none of them is cosmetic:

1. **The first run lands in a dead end.** With no folder open the compact landing
   rule shows the navigation view, and the brand screen — the only place that
   offers the guided demo, the browser warning, and the app's explanation — is in
   the hidden editor layer. Activating the brand from the rail does the same: an
   empty sidebar appears and the demo becomes unreachable.
2. **Most controls are pointer-sized.** Measured on the device and in a phone
   viewport: the rail's four controls are 40×40, a folder's close badge is 18×18,
   the calendar's month arrows are 28×28, its day cells 44×28, the Files rows and
   the meta panel's rows are 33 tall, every accordion summary 37, the status bar's
   page-name crumb 18 tall, the match-case toggle 30×30, and the search clear
   badge 18×18. `DESIGN.md` already requires 44×44 for the compact app bar and the
   Journal row; the rest of the phone's surface never got the same rule.
3. **The menus are right-click only.** Favoriting, removing a reminder, presenting
   a page, and setting a reminder from a calendar day all live behind
   `contextmenu`. A real 900 ms touch hold on a page row fires
   `pointerdown`/`pointerup`/`click` and no `contextmenu`, so on a phone those
   actions do not exist. The row menu is also deliberately trigger-less, so there
   is nothing to tap instead.

The rest of the shell already behaves: the folder picker opens from the rail and
writes through the File System Access API on Android Chrome, the keyboard shrinks
the shell (`interactive-widget=resizes-content`), the status bar clears the
gesture inset, and the view controls work — all confirmed on the device.

## What Changes

- **The compact landing shows the brand screen when no folder is open.** With a
  folder open and nothing selected the navigation view still leads, and with an
  item open the editor view leads. Closing the active folder or activating the
  brand returns to the brand screen instead of an empty sidebar.
- **The compact brand screen offers the open-folder action**, primary, because the
  compact shell hides the rail that normally carries it. The demo stays offered
  beside it, and the action is absent where the browser cannot open folders.
- **Every control the compact shell shows has a 44×44 target.** The rail's
  controls and a folder's close badge, the calendar's month arrows and day cells,
  accordion summaries, Files and meta-panel rows, the Contents disclosure and its
  expand/collapse controls, the status bar's name crumb, the search spotlight's
  toggle/clear rows, menu items, the brand screen's actions, and the presentation
  controls. A drawn glyph may stay its size; the target around it grows.
- **A press-and-hold opens the menu a right-click opens** on a touch-primary
  device: on a page row it opens the row menu, on a calendar day the reminder day
  menu. The rows still carry no visible trigger. A hold that moves (a scroll) or
  ends early is an ordinary tap.
- **A vault image carries no expand control at the compact breakpoint.** The
  control appears on pointer hover, which a phone does not have, and an image
  expanded past a phone's pane can only be panned sideways.

## Capabilities

### New Capabilities

None. This completes the compact shell the `workspace` spec already describes.

### Modified Capabilities

- `workspace`: the compact shell's landing rule (brand screen with no folder), the
  brand screen's open-folder action, and the touch-target rule extended from the
  app bar and Journal row to every control the compact shell shows.
- `favorites`: a page row's menu opens on the touch context-menu gesture
  (press-and-hold) as well as on right-click and the keyboard gesture.
- `reminders`: a calendar day's menu opens on the touch context-menu gesture as
  well as on right-click and the keyboard gesture.
- `editing`: a vault image has no expand control at the compact breakpoint.

## Non-goals

- **No new capability, and no experimental switch.** This completes a shipped
  surface (the compact shell, `add-compact-mobile-shell`) rather than adding one;
  gating it would need the retired toggle infrastructure and would ship a phone UI
  that is off by default. See design D6.
- **No visual redesign.** Same tokens, same panes, same glyphs, same three views,
  same safe-area padding. Only the brand screen's action row changes, and only at
  compact.
- **No board-editor work.** Excalidraw brings its own touch UI; its chrome, layout,
  and gestures are untouched (ADR-0024).
- **No task-checkbox resize.** A GFM task marker stays the 14px checkbox the
  `editing` spec requires at the text's baseline; growing its target would overlap
  neighbouring lines and change the document's line metrics. Ticking still works
  by pressing the box, and the marker remains editable text.
- **No drag-and-drop on touch.** Dropping a reference or a file into the editor
  stays a pointer feature; the reference completion popup already covers the
  phone's path to the same result.
- **No change above the compact breakpoint.** The wide three-pane composition,
  its strips, and its pointer-sized controls are untouched.
- **No new gesture on the rail or a board.** The touch context-menu gesture opens
  exactly the two menus that exist today, on exactly the rows that own them.
- **No new ADR.** The change follows ADR-0002 (Chromium-first), ADR-0011 (Kami),
  ADR-0005 (three-pane shell) and ADR-0006 (keep it small); no architectural
  decision changes.

## Impact

- **`src/App.tsx`** — the compact landing rule, and the open-folder callback the
  brand screen needs.
- **`src/compact.ts`** — a coarse-pointer reading beside the breakpoint reading.
- **`src/components/`** — a small long-press helper used by `Sidebar` and
  `JournalCalendar`; `EditorPane` (brand action, image control); and the module
  stylesheets of the rail, sidebar, accordion, calendar, meta panel, status bar,
  search spotlight, search results, row menu, shortcuts list, and presentation.
- **`src/index.css`** — the two button variants get a compact minimum height.
- **`DESIGN.md`** — the touch-target section covers the whole compact shell, the
  image rule gains its compact exception, and one sentence names press-and-hold as
  the phone's context-menu gesture.
- **Tests** — integration for the landing rule and the long-press path, e2e for
  the targets, the brand action, and the touch menus; the existing compact e2e and
  unit suites still apply.
- **No dependency, no build change, nothing persisted, and nothing added to the
  keystroke path.** Every change here is layout, one event handler on a press, or
  a route decision read at render time.
