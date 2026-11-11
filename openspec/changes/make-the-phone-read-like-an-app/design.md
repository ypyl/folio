# Design

## Context

See `proposal.md` — Why, and the measured review in
`.tmp/answers/folio-phone-design.html`. What shapes the approach:

- The compact shell is a 640px media query plus `useCompact()` in `App`. It
  shows one of three views at a time: the navigation view (rail + sidebar), the
  editor view, and the meta view.
- The compact status bar (`StatusBar`) is 53px and carries the two view controls
  as icon-only 44px buttons, the open item's name, and the save state.
- Type sizes are declared per component in px: editor 15px (CodeMirror theme),
  headings 1.15em, list rows 14px, section labels 11px, calendar days 12px,
  weekdays 10px, status 12px.
- The page row's menu (`RowContextMenu`) already holds Favorite/Unfavorite,
  Remove reminder, and Present; App owns the handlers (`handleFavorite`,
  `handleRemoveReminderFor`, `handlePresent`) and the open page's rule.
- The status bar's name control already locates a page's row or a journal day's
  cell through `handleRevealPage` / `handleLocateDay`, which show the navigation
  view at compact first.
- The vault restores a stored folder with its permission as `prompt` (no
  storage) and activates it; `handleActivate` requests the permission.
- `vite-plugin-pwa` builds the manifest from `vite.config.ts`; the icons live in
  `public/`.

## Goals / Non-Goals

**Goals**

- Phone text that reads at arm's length: 16px body and rows, 12px minimum labels.
- 48px targets, 16px margins, 52px rows.
- A named app bar above every compact view, with the open page's actions.
- The stored folder back in one tap after a cold start.
- An install dialog that shows the app's own screens.

**Non-Goals**

- No list-to-page stack, drawer, or details sheet (option C).
- No tab-bar redesign: the three views stay, with labeled controls.
- No wide-composition change, no dark mode, no new dependency, no toggle.
- No 200% text-scaling rewrite; the scale stays in px for now.

## Decisions

### D1: The compact scale is a fixed set of values, applied at the breakpoint

| Role | Before | After |
|---|---|---|
| Editor body | 15 | 16 |
| Editor heading | 17.25 | 20 (1.25em) |
| List row | 14 | 16 |
| Section label | 11 | 12 |
| Calendar day | 12 | 14 |
| Calendar weekday | 10 | 11 |
| Month label | 13 | 15 |
| Status text, tab label | 12 | 12 |
| Button label | 14 | 16 |
| Badge | 10 | 11 |
| Icon | 20 | 24 |
| Brand description | 14 | 16 |
| Fact label / detail | 13 / 12 | 14 / 13 |
| Footer note | 12 | 13 |
| Menu item | 13 | 15 |

The values live in each module's compact media block, the way the touch rules
already do, so one breakpoint owns the phone. The editor's base size is the
CodeMirror theme's 15px, so the compact block overrides the editor root to 16 and
a heading to 1.25em; headings are em-relative and follow. No `rem` conversion:
the app is px-based, and a text-scaling pass is its own change (a documented
non-goal).

Alternative considered: a global `:root` token set for the phone. Rejected for
now: most values differ per component (calendar vs menu), and tokens would not
remove the module rules, only add a layer.

### D2: 48px targets, 52px rows, 16px margins, one calendar exception

Every compact control reaches 48 by 48: the app bar's title and actions, the
rail's controls and close hit area, the accordion summaries, Files and meta rows,
menu items, search controls and rows, shortcut chips, presentation tools, and the
brand actions. Rows grow to 52 (48 plus padding) and the windowed listing's
stride becomes 54, so the spacers still add up. The navigation panes pad to 8px
around an 8px body, which puts a row's box 16px from the trailing edge.

The calendar's seven columns cannot all be 48 wide at 390px with the rail in
place. Its cells are 48 tall and take the column share, which is at least 44, and
the requirement says so. The alternative, removing the rail at compact, is option
C.

### D3: A labeled top app bar, and the view controls keep their place with labels

The app bar is a new `CompactBar` component: 56px, ivory, a hairline beneath, a
16px semibold title, and an optional 48px page-actions control. The title is a
control where locating applies: it calls the same `handleRevealPage` /
`handleLocateDay` the status bar's crumb calls, so the feature keeps one
implementation and the visible text is the accessible name. The bar is rendered
by `App` above the three layers and only at compact; the layers start below it.

The status bar keeps the two view controls but gives each a visible label under
its glyph ("Notes", "Details") and a 48px target, so the controls are named on
screen instead of only to assistive technology. The bar grows to 56px plus the
safe-area inset and the save state sits between the controls.

Alternatives considered:

- **A 3-tab bottom bar.** Rejected: the editor is the content, not a destination,
  and a tab for it would duplicate the list and the page.
- **A back-chevron stack and no view controls.** Rejected: the labels answer the
  discoverability gap with less new state and no history rewrite.
- **Icon-only controls at 48.** Rejected: size alone does not name them.

### D4: The page actions move to the app bar's overflow

`CompactBar` opens `RowContextMenu` at its actions control with the open page's
menu items, built in `App` from the same state the row menu uses: Favorite or
Unfavorite when the page has a Files row, Remove reminder with its schedule when
the page has a rule, and Present. The Details view is the status bar's "Details"
control, so the overflow holds no Details item. A journal day, a board, an asset,
the results view, and the brand screen show no actions control, because none of
them has a page row's menu.

### D5: The reconnect action is the brand screen's first action

`EditorPane` gains a `reconnect` prop: the stored folder's name and a callback.
`App` passes it while the active folder has no storage and its permission is
`prompt`, and the callback is `handleActivate(activeFolder.id)`, which runs the
existing request-permission path inside the user's tap. The action is primary;
the compact open-folder action, the demo, and the import follow as secondary
actions. On a wide window the same action appears first, because the reconnect
matters there too. Once the permission is granted the folder opens, the brand
screen is replaced, and the action disappears with it.

Alternative considered: auto-request permission on launch. Rejected: Chrome
requires a user gesture, and a prompt without context is worse than a named
button.

### D6: The manifest advertises the app's screens

`vite.config.ts`'s manifest gains `id: './'`, `categories`, and two `screenshots`
(`form_factor: 'narrow'`), captured from the phone layout after this change and
committed under `public/`. Chrome uses them for the richer install dialog.
Screenshots are build inputs like the icons; they carry no app behavior.

### D7: No experimental switch

This is the compact shell's second pass, not a new capability: the shell ships
ungated, and the change makes its phone composition readable and reachable. The
same rationale the previous phone change recorded applies.

### D8: Nothing new on the typing path

The scale is CSS; the app bar is a render-time component whose title and actions
are derived from the open page's existing state; the overflow opens on a tap;
the reconnect is a button. No parser, index, matcher, or editor decoration
changes, and no filesystem work moves onto a keystroke.

## Risks / Trade-offs

- **Vertical space**: 56px app bar plus a 56px status bar costs 59px more than
  today. → The bars replace the ambiguous controls and carry the title, so the
  content loses height but gains a heading; the editor's reading column stays
  usable at 390×844.
- **The windowed listing's stride** must follow the 52px row or the spacers
  drift. → `COMPACT_ROW_STRIDE` becomes 54 with a test, and the browser check
  scrolls a long listing.
- **The calendar at 390px** cannot give 48-wide cells with the rail. → The
  requirement states the exception and the e2e asserts 48 tall, 44 wide.
- **The title's locate action** could surprise a reader who taps the title
  expecting nothing. → The accessible name states the action ("Reveal X in
  Files"), and the handler does exactly what the old crumb did.
- **The app bar's actions duplicate the row menu's items.** → Both are built from
  the same App state and one `RowContextMenu`; the labels and order are asserted
  in one integration test per surface.
- **Screenshot upkeep**: the manifest screenshots go stale when the phone UI
  changes. → They are generated from the same build at the end of the change, and
  a later phone change regenerates them; a stale screenshot is a docs defect, not
  a behavior defect.
- **Text scaling at 200%** is untested by this change; fixed px and fixed bar
  heights could clip. → Recorded as a non-goal and a follow-up; the bars use
  min-height and the rows grow with their text.

## Migration Plan

No data or stored state changes. The compact scale is CSS; the views and history
are unchanged; the reconnect writes nothing new. Version takes a minor bump (a
phone-facing redesign). A rollback is a plain revert.

## Open Questions

None. The one deviation from the review's option B, dropping the third tab and
the back chevron in favor of labeled view controls and an app-bar title, is
settled here and recorded in D3.
