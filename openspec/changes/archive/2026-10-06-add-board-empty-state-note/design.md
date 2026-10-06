# Design

## Context

`BoardView` (`src/editor/boardView.tsx`) is the thin Excalidraw host: it lazily loads the package, parses `initialScene` into `initialData` once on mount, and reports element changes through `onChange`. App keys it by board path, so a board switch remounts rather than mutates. The host is deliberately vault-free (ADR-0010): it imports only `boardScene` and its stylesheet.

The `#!` reference grammar lives in `vault/parse.ts` (`boardToken`, `isBoardReferenceable`), and a board's token name is its filename stem, from `vault/index.ts` (`boardStem`) — not `boardName`, which is the sidebar's display label (the path inside `boards/`). App is the integration layer that already holds both.

See proposal.md — Why for the motivation.

## Goals / Non-Goals

**Goals:**

- Show a short, dismissable-by-nothing note on a board that holds no elements, naming its `#!` token and saying drawing saves it.
- Keep the editor layer free of vault imports (ADR-0010) and keep one writer per reference form (ADR-0023).
- Add no work to the typing path and no per-frame React work while drawing.

**Non-Goals:**

- A "New board" control, a board-creation chord, or any change to the shortcuts reference.
- Changing how a board is created, saved, or referenced.
- A hint before the first `#!` is typed (that is the `references` completion popup, a separate change).

## Decisions

**D1 — The note renders in BoardView; App passes the token.** The note is board-editor chrome, so it belongs with the host. But the token is vault grammar, so App computes it and passes one optional prop, `boardToken: string | null`:

```ts
`isBoardReferenceable(boardStem(path)) ? boardToken(boardStem(path), 'word') : null`
```

`'word'` yields `#!word` for a single word and `#![[Many Words]]` otherwise — the canonical form, produced by the existing writer, never hand-built. A `null` token means the name has no token form; the note then describes the reference without naming one. Passing the token rather than the name keeps `boardView.tsx` importing nothing from `vault/` (ADR-0010). Alternative rejected: let BoardView derive the token from a path — that would import vault logic into the editor layer. Alternative rejected: build the whole sentence in App — copy for a board surface would then live away from that surface.

**D2 — "Blank" is "no elements", tracked once per open.** On mount, `initialData.elements.length === 0` sets the initial state. In `handleChange`, a ref-guarded transition sets it false the first time elements are non-empty and never back, so deleting every element later does not bring the note back (the spec forbids reappearance for the open board). The guard means state updates once per board open, not per drag frame. Because App keys the host by path, a board switch remounts and re-evaluates cleanly.

**D3 — An overlay that takes no pointer input.** The note is a sibling of `<Excalidraw>` inside `.board` (already `position: relative`), absolutely positioned and centered in the canvas area, with `pointer-events: none` so it never intercepts a draw. It is a plain paragraph, not a dialog: no focus trap, no dismissal, no `aria-modal`. Styled from the app's tokens (DESIGN.md): a muted-text pill on an ivory surface with a hairline border and, at most, the whisper shadow. It carries no z-index that would cover the editor's toolbars (the toolbar is top-center, so the note sits centered/lower). Alternative rejected: Excalidraw's own hint slot — it is not a supported customization seam and shows its own copy.

**D4 — Derived only.** The note changes no file, no index, and no parser. It reads the already-parsed `initialData` and the already-computed token; it never enters the page parse, search corpus, or typing path.

## Risks / Trade-offs

- [The overlay could cover the toolbar or block a click] → `pointer-events: none`, no competing z-index, placed away from the top-center toolbar; the host test asserts the note exists and takes no pointer events.
- [A malformed scene parses to no elements, so a non-blank board shows the note] → `parseScene` already defaults to an empty scene, and the note clears on the first change; the failure is cosmetic, not data.
- [App must compute the token on every render] → it is computed only while a board is the open view, from `activePath`, and is a pure string of two small calls; it is not on any typing path.
- [Discoverability is only partly solved] → the note appears once a blank board is open, so it confirms the model rather than teaching the first `#!`; the completion-popup hint is recorded as a follow-up in the proposal's Non-goals.
