## Why

The header is a permanently reserved band across the top of every app state, and it exists for two reasons: the Folio brand and a search input. Search is an occasional, transient action — reaching for it does not justify a standing row of chrome in a writing app where vertical space is the product. Moving search into a keyboard-summoned spotlight (a modal overlay) removes the band and gives its height back to the page, while making search faster to reach: one chord from anywhere, no mouse trip to the top of the window.

## What Changes

- **Remove the header row entirely.** The workspace becomes the shell's top region; there is no standing band above the panes.
- **Move the brand home control into the folder rail** (top of the rail, above the add control). It keeps its behavior: activating it makes no folder active and shows the empty state, closing nothing.
- **Add a search trigger to the folder rail** (a magnifier control beside the brand) so search stays discoverable without the header.
- **Introduce a search spotlight**: a modal overlay opened from anywhere by `Ctrl+P` (and `Cmd+P` on macOS) or the existing `Ctrl/Cmd+K`. It holds the search input and the grouped results (Pages, Journal, Boards, Assets) with the same matching, per-group cap, snippets, line numbers, and Arrow/Enter navigation as today.
- **Dismissal is explicit**: `Escape` and a click outside close the spotlight. There is no always-visible input to keep the query in, so a close ends the search session and clears the query.
- **The see-all handoff survives**: activating the pinned see-all row closes the spotlight and opens the full search results view for the query.
- **The keyboard-shortcuts reference** lists the spotlight's chord(s) for the Search notes row (both bound combinations), and the row's search action opens the spotlight.
- **Shell layout drops the header** from the grid: the workspace fills the shell's top region, and the status bar keeps its place below it.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the shell no longer renders a header row; the brand home control and a new search trigger move to the folder rail; the keyboard-shortcuts reference's search row names the spotlight's chord(s) and opens it.
- `search`: search becomes a modal spotlight opened by keyboard shortcut or the rail's search trigger instead of an always-visible header input; deployment, dismissal, shortcut, and no-vault behavior are restated for the overlay.

## Non-goals

- No change to matching, ranking, the corpus, grouping, per-group caps, snippets, or line numbers — the same Fuse index and the same result model.
- Not a command palette: the spotlight searches notes and opens results; it introduces no commands, actions, recent items, or fuzzy command list.
- No new search entry points beyond the rail trigger and the keyboard shortcut; no omnibox integration, no `[[` reference search.
- No change to the search results view itself beyond how it is reached.
- No persistence of anything new; no app database (ADR-0001, ADR-0009). The rail's brand and search trigger add no vault reads.
- No new ADR: this stays inside ADR-0005 (keep the UI small) and ADR-0011 (Kami tokens), and removes chrome rather than adding a feature.

## Impact

- `src/index.css`: the shell grid loses its header row; the workspace becomes the top region.
- `src/components/Header.tsx` + `Header.module.css`: removed.
- `src/components/FolderRail.tsx` + `FolderRail.module.css`: gains the brand home control and the search trigger.
- `src/components/SearchBox.tsx` + `SearchBox.module.css`: reworked into a spotlight overlay (or replaced by a `Spotlight` component) that owns open/close and the results list.
- `src/components/shortcuts.ts`: the App group's Search notes row lists both chords.
- `src/App.tsx`: drops the `Header` render; owns spotlight open state and the rail's search-trigger wiring; keeps `handleSelect` / `handleOpenAsset` / `handleOpenBoard` / see-all wiring.
- Tests: `Header.test.tsx` removed; `SearchBox.test.tsx`, `FolderRail.test.tsx`, `App.test.tsx`, `shortcuts.test.ts` updated.
