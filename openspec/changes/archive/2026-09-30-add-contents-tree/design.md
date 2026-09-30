## Context

See `proposal.md` — Why. Today `deriveContents` returns a flat `ContentEntry[]` (level, text, block) and `MetaPanel`'s `ContentList` renders one button per entry, indented by level. App memoizes the rows on the page's saved content and passes them down; `onLocate` sets the same block highlight a search result uses. The panel is otherwise stateless. Constraints: Markdown stays canonical (ADR-0001/0009), the heading surface is ADR-0027's replacement for the removed list folding, and view-only session scoping is the precedent ADR-0026 set.

## Goals / Non-Goals

**Goals:**

- Give the Contents rows a tree shape derived only from heading levels, with a collapse/expand control on headings that have a subtree.
- Keep the existing value: label plain-text reduction, level-based indentation, locate-on-activation, scroll/size behavior, and the keystroke budget.
- Keep App and its memo graph untouched; the tree and the collapse state are panel-local.

**Non-Goals:**

- Persisting collapse state, or any vault/`.folio/` write.
- ARIA `tree`/`treeitem` roving-focus semantics — a nested list with disclosure buttons is the smaller correct surface.
- Changing the heading parser, the locate mechanism, or any other panel section.

## Decisions

### D1: A pure tree in `contents.ts`, built where it is shown

`buildContentTree(entries: ContentEntry[]): ContentNode[]` lives beside `deriveContents` as pure, tested logic. A node is its entry plus `children`. A heading is a child of the nearest preceding heading with a lower level; the run of deeper headings before the next heading at that level or lower is its subtree. `MetaPanel` memoizes the tree on the `contents` identity — the same array App already memoizes on saved content — so the tree is built once per save, not per keystroke.

Alternative — build it in App and pass a tree prop — rejected: it changes App's props and its memo for no benefit, and the tree is a display concern of the panel. Keeping `contents` as the prop also keeps the existing test setup and the App contract intact.

### D2: Collapse state is panel-local, session-scoped, per open page

State is a `Set<number>` of collapsed `block` indices held in `MetaPanel`, reset when the open page changes. The reset uses React's "adjust state when a prop changes" pattern on `activePath`: state holds `{ path, blocks }`; when `path !== activePath` the component resets to an empty set during render. Putting the state in `MetaPanel` means a toggle re-renders only the panel, not App or the editor, and no new state joins App.

Alternatives — App-owned state (wider re-render, touches the memo graph), or persisting in `.folio/` (a new class of UI state; ADR-0026 deliberately left that to a separate decision) — both rejected.

### D3: Two controls per disclosure row, not nested `<details>`

A heading with a subtree renders a disclosure `<button aria-expanded>` and its label `<button>`; a heading without one renders an `aria-hidden` spacer of the same width so labels stay aligned. The disclosure toggles; the label locates. Splitting them keeps the two distinct actions and keeps valid HTML, which a `<summary>` wrapping a locate button could not (the label action would have to be folded into the summary).

Alternative — nested `<details>`/`<summary>` per heading — rejected: native markers need restyling, indentation interacts with the disclosure marker, and the locate action would have to share the summary's click.

### D4: Indentation stays level-based; nested lists add none

Each row keeps `paddingLeft: 8 + (level - 1) * 12` as its single source of indentation, and the nested `<ul>` resets `margin: 0; padding: 0; list-style: none`. So nesting changes which rows are shown, not how far they are indented, and the existing "indented by level" requirement and test carry over unchanged.

Alternative — indent by nesting depth — considered and rejected: heading level is the depth the app already rewards, and depth-based indentation would differ from the current spec for skipped levels (for example `#` then `###`).

### D5: Render nested lists, hide collapsed subtrees by not mounting them

`ContentList` renders a recursive list; a collapsed node's children are simply not rendered, so hidden rows cannot be focused or located and no `display: none` state needs syncing. Visible-row work is O(shown headings) per render.

### D6: The disclosure chevron reuses the accordion's recipe

The chevron is a `<span aria-hidden>` with the section summary's border-and-rotate treatment (`Accordion.module.css`), so the panel has one disclosure look and no new icon or palette value. `aria-expanded` on the button, with an accessible name that names the heading ("Collapse Beta" / "Expand Beta"), carries the state.

## Risks / Trade-offs

- **Stale `block` indices after an edit shifts headings** → a saved edit above a collapsed heading can move an index to another heading. Bounded by design: the state is session-scoped, resets on page change, only hides rows, and never writes anything; it is a reading convenience, not data. Index pruning against the current tree can be added if it proves annoying.
- **A disclosure row is two tab stops** → accepted, and only for headings that actually have a subtree; a leaf row is one tab stop as before.
- **jsdom has no layout** → chevron rotation and nested-list indentation are not unit-testable; structural tests cover toggle/locate and visibility, and a browser check confirms the rendering.
- **Existing test queries every button in the section** → with a chevron button added, that query's expected list changes; the test is updated to query label buttons by their accessible name (not a behavior change).
- **Building the tree is O(headings)** → bounded by a page's heading count, rebuilt only when the saved content changes, never per keystroke.

## Migration Plan

No persisted state; nothing to migrate. Rolling back is removing the tree derivation and restoring the flat list.
