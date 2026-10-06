# Design

## Context

The shell is a grid of boxed regions — the folder rail (`#folder-rail`, 56px), the
sidebar (`#sidebar-pane`), the editor pane (a `<main>` inside `EditorPane`), the
right meta panel (`#meta-panel`, 280px), and the status bar (a `<footer>`) —
wrapped in three `.view-layer` regions. On wide viewports those wrappers are
`display: contents`, so they have no box and no `getBoundingClientRect`; only the
regions inside them do. `SearchSpotlight` already establishes the app's one
overlay recipe: a fixed scrim (`z-index: 100`), an ivory card with a whisper
shadow, `role="dialog"`, `aria-modal`, Tab containment, Escape, and focus
restore. `move-help-to-right-panel` deleted the old `?` modal and made the
reference a panel section. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- A rail control that opens a guided tour of the shell's regions on demand.
- Reuse the existing overlay and focus contract rather than invent one.
- Add nothing to the typing path and no new dependency.

**Non-Goals:**

- Working on the compact shell (see D3).
- Auto-launching on first run or persisting any "seen" state.
- Interactive steps that act on the user's behalf.

## Decisions

**D1 — Build the tour; do not add a tour library.** `react-joyride` would add a
transitive dependency tree, fight the Kami palette with its own styles, and
bring its own focus/Escape model, while the app would still own the steps, the
rail wiring, and the state handling. The genuinely hard parts it would save —
the spotlight cut-out and the placement math — are a single element with a
spread shadow and one side-priority function. Alternative rejected: a static
"Getting started" section in the right panel (teaches by reading, not by
pointing, and the request is a tour). Alternative rejected: a non-blocking
coachmark (loses the highlight and still needs placement, while raising its own
dismissal questions).

**D2 — A scrimmed modal, and say so.** The tour reuses `SearchSpotlight`'s scrim
colour, ivory card, whisper shadow, `role="dialog"`, `aria-modal`, Tab
containment, Escape, and focus-restore-in/out. This adds a modal back after
`move-help-to-right-panel` removed one, but that change's argument was about
reference content ("the most reference-like content is the one thing you have to
open and close"); onboarding is genuinely a moment to be dismissed, and the
modal pattern was never actually gone — the spotlight keeps it. No ADR: this is a
UX surface, not an architectural boundary.

**D3 — Wide-only, and the reason is behavioral, not effort.** The compact shell
shows one view at a time and the `workspace` spec has *showing a view push a
history entry*. A tour that flipped views to reach every region would push an
entry per step and turn the Back gesture into tour navigation. So `App` passes
the rail's `onTour` only when `!compact`, the same optional-callback shape `onAdd`
uses for the picker, and the rail renders no tour control on compact.

**D4 — Steps resolve targets by attribute, not by ref.** The step list names a
region; the tour finds it with `document.querySelector('[data-tour="..."]')`.
This keeps the tour out of every parent's props. Targets are the boxed regions:

| Step region | Target |
|---|---|
| Folder rail | `#folder-rail` |
| Sidebar | `#sidebar-pane` |
| Editor area | the editor pane's `<main>` (new `data-tour="editor"`) |
| Right panel | `#meta-panel` |
| Status bar | the status bar's `<footer>` (new `data-tour="status"`) |

A target that is not rendered — the editor while results, a board, or the import
owns the main slot — yields no rect; the step then shows its card centered and
still explains the region (spec). `.view-layer` wrappers are never targets,
because `display: contents` leaves them boxless on wide viewports.

**D5 — Measure on step, resize, and scroll; nothing while closed.** The overlay
is `position: fixed`, so viewport coordinates from `getBoundingClientRect` are
the right coordinates. A `useLayoutEffect` measures on open and step change, and
`resize` plus capture-phase `scroll` listeners re-measure while open, because
several targets live in scroll containers (rail, sidebar, meta panel). Every
listener is added only while the tour is open, so the closed app carries none and
the keystroke path gains nothing. Placement tries below, above, right, then left,
and clamps to the viewport.

**D6 — The rail control matches the rail's controls and the panel footer's
anchor.** A 40x40 rounded square with a `?` glyph, following the rail's existing
40x40 control size and 8px radius, styled like the search trigger (ivory fill,
hairline border, brand tint on hover) so it reads as a rail control and not a
second accent. It is held to the bottom by the same recipe the meta panel footer
uses — `margin-top: auto`, `position: sticky`, `bottom: 0`, `flex-shrink: 0`, on
the rail's own `--ivory` fill — so it stays reachable however many folders the
rail lists.

**D7 — The search chord closes the tour.** `SearchSpotlight` listens for
`Ctrl/Cmd+K` and `Ctrl/Cmd+P` on `document`, so it can open over the tour. `App`
gives the spotlight an `onOpen` that closes the tour first, and the tour renders
above the spotlight's `z-index: 100` (at 200). This is one line each, and it
avoids two stacked overlays.

**D8 — On demand only, derived from nothing.** The tour writes no file, reads no
vault data, and keeps its open state and step in React memory. It never launches
itself, so there is no first-run marker and no `.folio/` change (ADR-0015 stays
untouched).

## Steps

Five steps, one per region. Each reads correctly with no folder and no page
open, and the right panel's step also points at the keyboard-shortcuts
reference, so the tour stays at one step per region rather than splitting a
region across two.

| # | Region | Title | Explanation |
|---|---|---|---|
| 1 | Folder rail | Your folders | Opened folders sit here. The mark goes home, the magnifier searches, and `+` opens another folder. The `?` at the bottom reopens this tour. |
| 2 | Sidebar | Journal and Files | The calendar marks days that have a note, and Files lists every page, board, and file in the open folder. |
| 3 | Editor area | Your page | Pages open here as plain Markdown and save as you type, so the folder on disk always matches what you see. |
| 4 | Right panel | Outline and links | Contents mirrors the page's headings, and Links lists the pages that reference this one and the pages it references. The keyboard-shortcuts reference waits at the bottom. |
| 5 | Status bar | Getting around | Back and Forward walk the pages you have visited, and Today opens the current day's journal. The far end names the open folder and its file count. |

## Risks / Trade-offs

- [Reintroducing a modal contradicts `move-help-to-right-panel`] → Documented in
  D2; onboarding is a one-time dismissable moment, the pattern already exists in
  `SearchSpotlight`, and the shortcuts reference stays a panel section.
- [Tooltip geometry drifts on scroll or resize] → Re-measure on step, resize, and
  capture-phase scroll; clamp to the viewport; jsdom cannot measure, so the
  geometry is verified in Playwright and the unit tests cover state and focus.
- [A target is off screen on results, a board, or the import] → The card centers
  and still explains the region; this is a spec scenario, not a failure.
- [Two overlays stack when the search chord fires] → D7: the chord closes the
  tour, and the tour sits above the spotlight.
- [The rail control disappears when the left navigation folds] → Folding the left
  unit hides the whole rail (`visibility: hidden`), so the tour is reachable only
  while the rail is shown, like every other rail control; the shortcuts reference
  stays reachable in the panel.
- [Focus restore fails if the rail is folded while the tour is open] → Focus
  restore targets the control that opened the tour; if it is no longer
  focusable, focus falls back to the document, which is the same degradation the
  spotlight has today.
- [Sticky bottom control inside a scrolling rail] → The meta panel footer
  already proves the recipe; the browser check confirms it with an overflowing
  folder list.
