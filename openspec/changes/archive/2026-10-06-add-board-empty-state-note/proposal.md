# Proposal

## Why

A new user cannot discover how a board is made. There is no "New board" control, and the only route is to type a `#!` reference and activate it; the sidebar Files listing and search show boards only after a file exists, so they cannot teach creation. Once that reference opens a blank board, nothing on the surface says what the user is looking at, that drawing will save it, or how it connects back to a page. The board feature is otherwise complete (ADR-0024); this closes the one gap a first-time user hits.

## What Changes

- A board that holds no elements SHALL show a short note over its canvas: the board's `#!` reference token, so the user can write it in a page, and the fact that drawing saves the board.
- The note SHALL be presentational only: it SHALL NOT block drawing on the canvas, SHALL NOT be a dialog, SHALL NOT trap focus, and SHALL require no dismissal.
- The note SHALL disappear once the board holds an element, and SHALL NOT reappear for that open board.
- A board that holds elements SHALL show no note.
- The keyboard-shortcuts reference SHALL be unchanged: it keeps listing only the chords the app actually binds. This is the third option considered there — a note on the board surface rather than a non-chord row in a chord reference.
- No other board behavior changes: creating, opening, editing, saving, referencing, and searching a board are untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: add a requirement that a board holding no elements shows an in-canvas note naming its `#!` reference token and the save-on-draw behavior.

## Impact

- `src/editor/boardView.tsx` and `src/editor/boardView.module.css`: the note element, its "board is blank" state, and its styles.
- `src/App.tsx`: passes the board's name (and its `#!` token when the name is referenceable) into `BoardView`, computed through `vault/parse`'s `boardToken`/`isBoardReferenceable` and `vault/index`'s `boardStem`.
- `src/editor/boardView.test.tsx`: the mocked-Excalidraw host tests for the blank note, its clearing on the first element, and its absence on a board with elements.
- Related ADRs: ADR-0024 (a board is a board file the app edits), ADR-0010 (the editor layer stays vault-free), ADR-0001 (the note is derived state, never written to disk), ADR-0023 (the token comes from the existing `boardToken` writer). No new ADR: this adds an empty-state surface, not an architectural decision.
- No new dependency. No change to `VaultStorage`, the index, the parser, or the search corpus.

## Non-goals

- Not adding a "New board" button or a keyboard chord for board creation.
- Not changing the keyboard-shortcuts reference or its contract (only bound chords, click-to-apply).
- Not changing how a board is created, saved, or referenced, and not touching the `#!` grammar.
- Not showing the note on a board that already holds elements, and not adding persistent help chrome or an onboarding flow to the board editor.
- Not adding a hint where the first-time user most needs one — inside the `#!` completion popup when no board matches. That is a separate change against the `references` capability; this note only reaches the user once a blank board is open.
- No backend, no database, no block-based document model.
