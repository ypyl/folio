## Context

See proposal.md — Why. Constraints that shape the approach:

- The editor is Milkdown + `preset-commonmark` behind the `EditorAdapter` seam (ADR-0008, ADR-0010). The adapter exposes markdown in/out and change events; it knows nothing about the vault.
- `src/vault/parse.ts` holds the one canonical reference regex (`REF`) so the index tokenizes exactly what the editor preserves (design D6 of scan-parse-index). Only the index consumes it today.
- The open page is always editable; there is no read mode. Any rendering that depends on the caret or focus costs a repaint on every caret move.
- `DESIGN.md` already specifies a "References / chips" component (`--chip-bg` on `--brand` text, recede `--brand-tint`), but `--chip-bg` was never added to `src/index.css`.
- The Forwardlinks panel already resolves a reference name to a page path (`graph.byName` ?? `` `${target}.md` ``) and routes through `handleSelect`.

## Goals / Non-Goals

**Goals:**
- References are visible and clickable in the body without touching the Markdown they represent.
- Zero rendering work on caret moves and focus changes; the editor stays as responsive as it is today.
- One tokenizer: what the editor badges and what the index counts can never drift.

**Non-Goals:**
- A reference document node, second parser, or serializer (no schema change).
- Reveal-on-edit / source-on-focus behavior.
- Fixing the index's pre-existing habit of counting references inside code.

## Decisions

**D1 — Inline decoration, not a custom node.** Render badges by mapping each `REF` match in the document to a `Decoration.inline` with a `ref` class. Alternative considered: a ProseMirror atom node with a node view (Logseq-style chip showing the label only). Rejected: it needs a second tokenizer in the remark layer plus a serializer, and two tokenizers can drift — the opposite of what D6 bought. A decoration leaves the text literal, so Markdown stays canonical with no round-trip risk; the visible cost is that `#[[Reading Log]]` shows its brackets inside the badge.

**D2 — Always-chip; no reveal.** The badge never changes with the caret or focus. Alternative considered: hide the badge in the block being edited (Obsidian Live Preview). Rejected: it repaints on every caret move, and the mousedown that focuses a block strips the chip a frame before the click navigates. This is the change's core smoothness constraint (spec: "Badges do not follow the caret").

**D3 — Plain click opens; keyboard via Mod+Enter.** No modifier for the mouse. Editing a reference is by keyboard or by clicking at the badge's edge — the sacrifice in exchange for D2. Alternative considered: Mod/Ctrl-click opens, plain click edits (Obsidian). Rejected only because the request asks for plain click; it remains a one-line change later. `Mod+Enter` is already bound to `exitCode`, but the two can't collide: a reference is never inside a `code_block` (D5), and `exitCode` is inert in prose, so the reference handler claims the chord only where it applies.

**D4 — Decoration state recomputed on document change only.** Hold the `DecorationSet` in plugin state: `apply(tr, prev) => tr.docChanged ? scan(tr.doc) : prev`. Selection-only and focus-only transactions return the same set untouched, so caret movement does no scanning and no repaint. No mapping is needed: decorations are a function of the document alone, so a transaction that does not change the document cannot invalidate them. `ponytail:` a full-document rescan on each text change; reference counts are tiny and notes are small, so this holds until a page large enough to measure appears.

**D5 — Skip code.** While scanning text nodes, skip a node that carries the `code` mark, and skip any text whose ancestor chain includes a `code_block` node. The code-block component renders CodeMirror and exposes no `contentDOM`, but the code text still lives in the ProseMirror document, so it must be excluded explicitly. (Fenced text is skipped by the `code_block` check; inline code by the mark check.)

**D6 — Share the tokenizer.** Export `REF` (or a small `findReferences(text)` range helper) from `src/vault/parse.ts` and have the editor import it. The editor then badges exactly the tokens `parseLinks` counts. One regex, two consumers — the pattern `src/lineAnchors.ts` already sets for the editor and search.

**D7 — Navigation stays in the App; the editor reports the target.** The adapter detects a click whose position falls inside a reference range and calls `onReferenceClick(target)`; `EditorPane` forwards an `onOpenReference(target)` prop; `App` resolves the name and calls the existing `handleSelect`. The editor never sees a path or the graph (ADR-0010). Resolution reuses the Forwardlinks logic, including the not-yet-created page and the self-reference skip.

**D8 — Chip styling.** Padded pill on registered tokens: `--chip-bg` fill, `--brand` text, small radius, safe padding, `cursor: pointer`, hover to `--brand-tint` ("hover lightens", DESIGN links). Unlike the old preview chip, the text stays selectable (no `user-select: none`). `--chip-bg` is added to `src/index.css`. No ARIA role or tab stop: a non-focusable span cannot be activated, so announcing it as a link would dangle a control; the Backlinks/Forwardlinks panel remains the accessible, keyboard-navigable link list.

## Risks / Trade-offs

- **Badge and backlinks disagree inside code** → the index still counts `#word` in code spans/fences while the badge does not. Pre-existing index behavior, deliberately out of scope (proposal Non-goals); the fix is teaching `parseLinks` to skip code, a separate change.
- **Two consumers of `REF` drift** → single exported regex (D6) plus a test asserting the editor's ranges and `parseLinks` agree on a shared fixture.
- **Decoration scan cost on large pages** → D4's ceiling; revisit with region-only rescans if profiling ever shows it.
- **Full-doc rescan mis-maps decorations across edits** → mapping through `tr.mapping` on non-doc transactions and a fresh scan on doc changes is the standard ProseMirror pattern; a smoke test covers typing inside and around a reference.
- **`#1 issue` prose reads as a reference** → pre-existing regex behavior documented in the page-references spec; unchanged.
- **Round-trip** → none: no node, no serializer, the file bytes are whatever the text says.

## Migration Plan

Not applicable — new app, no deployed users, no stored format change. Rollback is a git revert of the implementation commit. `sample/Welcome.md` copy is updated within this change because it currently asserts references are "plain editable text".
