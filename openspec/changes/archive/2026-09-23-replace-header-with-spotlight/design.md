## Context

See proposal.md — Why. Today `App.tsx` renders a `Header` that spans the top of the shell, holding the brand home control (left) and `SearchBox` (center). `SearchBox` owns the query, a `Fuse` built in `useMemo` on the corpus (rebuilt only when the corpus identity changes, never per keystroke), the results dropdown, the outside-click/`Ctrl+K` listeners, and the see-all handoff. `App` already mirrors the landed query and results in `searchQuery` / `searchResults` to feed `SearchResultsView`. The shell grid in `index.css` is `auto 1fr auto` (header, workspace, status bar), and the workspace and header share pane-width variables so the header can mirror a pane collapse. `FolderRail` is a fixed 56px column with an add control and folder avatars.

## Goals / Non-Goals

**Goals:** remove the header band; keep the existing search behavior (Fuse, groups, caps, snippets, line numbers, keyboard nav, see-all, results view) under a modal spotlight; keep search reachable by chord and by a visible rail control; keep the query across a close so the see-all round trip still works; keep typing off any vault-proportional path.

**Non-Goals:** new matching or ranking; command-palette actions; persisting the spotlight state; changing the results view; focus-trap machinery beyond containing Tab; any ADR.

## Decisions

**The spotlight stays a mounted component that returns `null` when closed.** `SearchSpotlight` (reworked from `SearchBox`) keeps its `query`, `results`, `Fuse`, and `active` state in hooks and renders nothing while `open` is false. A component that returns `null` is still mounted, so the query survives a close and reopening restores the dropdown without retyping — which the existing specs require ("Outside click closes but keeps the query", "See-all row returns to results after opening a result"). App still keys it on `activeFolder?.id`, so a folder switch remounts it and clears the query.
- Rejected: **unmount the overlay when closed and lift the query into `App`.** It grows `App` and still needs the results mirrored back up; the null-render keeps state next to the code that owns it.
- Rejected: **`display: none` on a rendered overlay.** It leaves background controls focusable unless the subtree is also `inert`; a null render is simpler and the query is the only state worth keeping.

**The `Fuse` rebuilds once per open, not per keystroke.** The `useMemo` key is the corpus identity as today, so the index is stable while typing. Unmounting is avoided, so a close/reopen does not rebuild it either. Even a rebuild on open would be a one-time `O(corpus)` cost, smaller than the existing rebuild on every graph change (every save), so the keystroke budget is untouched.

**The overlay is a fixed, app-level layer driven by one `open` boolean.** `App` owns `searchOpen` and passes it down; the chord listener and the rail trigger both set it. The overlay renders a scrim (`position: fixed`, Kami `--parchment` at the app's one allowed surface, hairline border, no shadow), `role="dialog"`, `aria-modal="true"`, `aria-label="Search"`. On open it saves `document.activeElement` and focuses the input; on close it restores that element — so a chord from the editor returns the caret there. Escape and a click on the scrim close it. Tab is contained within the overlay by wrapping focus across the overlay's focusable elements (input, clear, result rows, see-all).
- Rejected: **an inline dropdown anchored in the rail.** It cannot show the full-width grouped list and would fight the rail's 56px column.
- Rejected: **a real `inert` on the background shell.** It works, but it couples the overlay to the shell's DOM; a small Tab wrap keeps the modal self-contained.

**Both chords are bound on one document listener.** `Ctrl/Cmd+P` and `Ctrl/Cmd+K` open the spotlight, gated on the same "a usable vault exists" rule as before (`graph !== null`). `preventDefault()` stops the browser's Print dialog for `Ctrl+P`. The listener lives in the spotlight and is removed on unmount.

**The brand and the search trigger are `FolderRail` props.** `FolderRail` gains `onHome` and `onSearch`; it renders the brand first and the search trigger below it in every state (including while stored folders are restoring, where it currently returns an empty rail). The trigger takes `disabled` while no vault is usable. `App` wires `onHome` to `goHome` and `onSearch` to opening the spotlight.
- Rejected: **putting the brand in the status bar.** The status bar's leading column already holds the pin; the rail is the app's identity column and keeps "return home" next to the folders it lists.

**The shell grid loses its first row.** `index.css` changes `.app-shell` to `1fr auto` (workspace, status bar). `Header.tsx` / `Header.module.css` are deleted; `--sidebar-cur` / `--panel-cur` stay for the workspace grid. `App` drops the `<Header>` render.

**`shortcuts.ts` lists both search chords.** The App group's Search notes row becomes `keys: ['Mod-k', 'Mod-p']`; the existing "each key combination is its own control" behavior gives two controls, and the existing `applyShortcut` dispatch on `document` replays the chord into the spotlight's listener.

## Risks / Trade-offs

- **`Ctrl+P` collides with the browser's Print** → `preventDefault()` on the bound chord; the listener only fires when a usable vault exists, so the browser keeps Print on the empty state.
- **A global `Ctrl+P`/`Ctrl+K` while the editor owns the keystroke** → the chord is app-level by design (search is global); the editor binds neither, and the existing `Ctrl+K` already behaves this way.
- **The rail loses vertical room to the brand and trigger** → both are small fixed controls and the rail already scrolls vertically only; the entries list keeps its `flex` scroll region.
- **Focus containment via a Tab wrap is easy to get subtly wrong** → the overlay is small and static (input, optional clear, rows, see-all); a test asserts Tab cycles within it and Escape restores focus.
- **A modal hides the results view it opens** → activating see-all closes the spotlight and opens `SearchResultsView`, which is the existing behavior; reopening the spotlight over the view and editing updates both because `App` drives both from one `searchQuery`.
