## Context

The header search input has been inert since ui-shell ("Inert until the search step" — see proposal.md for the why). Everything search needs is already in memory: the live index graph holds every page's `path`, `title`, `kind`, and full `content`, and `handleSelect(path)` is the single navigation primitive used by the sidebar and calendar. The app has no keyboard handling and no floating layers yet. This design carries over openspec-viewer's proven search model (Fuse config, AND-terms, exact-range highlighting, debounce, dropdown anatomy) rather than inventing a new one.

## Goals / Non-Goals

**Goals:**
- Search derive entirely from the in-memory graph — rebuilt and re-derived as the index changes, no new storage, no filesystem access (ADRs 0001/0003/0009).
- Keep the component boundary pattern intact: components receive page data via props, never importing the vault.
- Make this the app's first keyboard pattern (a global Cmd/Ctrl+K listener) so later gestures have a template.

**Non-Goals:**
- No Milkdown decorations: in-editor match highlighting is the one osv piece that crosses the editor boundary (ADR-0010); deferred to the PLAN Later list as its own change.
- No persistence of queries, no multi-folder search (only the active folder has an in-memory index).

## Decisions

### Overlay dropdown under the input, not a sidebar panel
PLAN's original words were "results in the sidebar", written when the Journal section was a flat list. Today that section is a calendar. A sidebar takeover would unmount the calendar and Pages list on every keystroke (a search/browse mode toggle), split the active-row marking between two surfaces, and render results far from the keystrokes that drive them. The overlay keeps every existing surface mounted; search is an interruption that dismisses cleanly (Esc / click-out), which is greener for a small local-first app (ADR-0006). Downside: first floating layer in the app — one absolutely positioned box, z-index constant, nothing subtle.

### Input width matches the content column
The header grid's third column already mirrors the editor pane (`56px | 240px | 1fr | 220px`), so sizing the input to that cell (`min(980px, 100%)`, centered, dropping the 480px cap) makes the box and its dropdown align with the content below — the same rule openspec-viewer documents for its own search. The dropdown is `width: 100%` of the input's relative wrapper, so it inherits the size for free.

### Search core copied from openspec-viewer
Fuse options and semantics are taken from osv's production-tested `app/search.js`:
- `keys: [{name:'title', weight:3}, {name:'text', weight:1}]`, `threshold: 0.25` (strict), `ignoreLocation: true`, `minMatchCharLength: 3`. Loose-fuzzy default thresholds return junk on notes; 0.25 stays typo-tolerant without it.
- AND across terms: each query term's Fuse hits are intersected per document; a document must match every term; scores summed, sorted ascending.
- **Highlighting prefers exact ranges.** Fuse's fuzzy `indices` are per-character and render as scattered 1–2 char marks. The render path finds exact case-insensitive occurrences of each term for the ranges; only when a term has no exact occurrence (a typo) does it fall back to Fuse's fuzzy range, dropping fragments under 3 chars.
- Snippets window around the first match line (±2 lines), rendered as hit/non-hit segments, clamped to 3 lines in CSS.

### Fuse lifecycle: memoize on graph identity, no separate version
osv keeps a `searchVersion` signal and rebuilds its Fuse when it bumps. Folio's graph object is *already* replaced on every save and diff-refresh, so the graph's identity is the version — a `useMemo(() => new Fuse(docs, opts), [graph])` rebuilds automatically when the index changes and the search never goes stale. No async corpus load either: the corpus IS the in-memory graph, so search is synchronous after the debounce — osv's stale-query guard (written for its IndexedDB round-trip) is unnecessary here.

### Component boundary
A new self-contained component owns input + clear ✕ + dropdown; it receives `docs` (page title/kind/content) and `onSelect` via props and memos its own Fuse on the docs identity — mirroring how Sidebar receives pages and how "components never import the vault" works today. The mathematical helpers (term split, AND intersect, exact/fuzzy ranges, snippet segments) are pure functions, unit-testable without the DOM.

### Keyboard
A document-level Cmd/Ctrl+K listener focuses and selects the input (osv's pattern; also how PLAN's "keyboard shortcut" is satisfied). Inside the input: Arrow Up/Down move an active-row index (hover sets the same state), Enter opens the active row, Escape clears query and closes. Active index resets when the query changes. **Ctrl+P is deliberately not hijacked** — osv does to kill the print dialog, but printing a note is a real browser feature and Folio has no reason to steal it.

## Risks / Trade-offs

- [Fuzzy matching still returns a wrong page occasionally] → strict threshold + AND terms + title weighting; exact-range highlighting keeps the snippet honest about *why* the page matched.
- [The 480px → content-column input is visually large] → that is the point (aligns with content, matching osv); the box stays a calm bordered input, no chrome.
- [Graph replaced on every autosave rebuilds the Fuse] → rebuild is O(docs) over in-memory strings at Folio's scale (a few hundred pages) — negligible; memo boundaries keep it to graph-change, never per keystroke. `ponytail:` note if it ever matters: debounce rebuilds instead of rebuilding per graph identity.
- [Cmd/Ctrl+K hijacked globally may surprise if Milkdown later binds Cmd+K in the editor] → accepted today (Milkdown v7 does not bind it); revisit only if the editor grows a conflicting shortcut, by scoping the listener away from the editor.
- [First z-index in the app] → one constant on the dropdown, no stacking-context nesting (the header establishes none).

## Migration Plan

In-app feature, no data migration. Rollback is reverting the change commit; the input returns to its inert placeholder state.