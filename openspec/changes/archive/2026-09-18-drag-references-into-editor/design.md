## Context

See `proposal.md` for why. What the design has to work with:

- `linkForAsset(path)` (`src/vault/link.ts`) is the app's one rule for the text that names a vault file; drop, paste and the destination picker all write through it. `referenceToken(name, 'word')` (`src/vault/parse.ts`) is the one rule for a reference token, and `findReferenceRanges(token)[0].target === name` is the app's existing test for "this name has a token form at all" — it is what keeps a name out of the completion pool today (`suggest.ts`'s `insertable`).
- `EditorAdapter.insertMarkdown(markdown)` (`src/editor/editor.ts`) inserts at `view.state.selection`. `MilkdownAdapter.insertParsedMarkdown` (`src/editor/milkdown.ts`) parses the Markdown and then has three branches — a single paragraph is unwrapped to its inline children (an image or link lands on the caret's line), a single other block replaces the selection, a multi-block payload replaces the block it sits in.
- Both sidebar listings are windowed (`pageWindow.ts`), so only the rows near the viewport exist in the DOM. They are already the rows a user can aim at.
- `Sidebar` is `memo`ized and its comment names its contract explicitly: a prop rebuilt on every render silently disables the memo (AGENTS.md: the keystroke budget).
- `view.posAtCoords({left, top})` is already in use in this codebase for turning pointer coordinates into a document position — `tableCellCaret.ts` and `inlineDecorations.ts` both call it.
- An asset row's activation opens the file (ADR-0021) and writes nothing (ADR-0022).

## Goals / Non-Goals

**Goals:**

- A page gains a reference to a file or a page already in the vault by dragging the row that shows it, without knowing either piece of syntax.
- The reference that lands on disk is byte-identical to the one the typed path writes. Nothing about the reference grammar changes.
- The gesture writes nothing to the vault, and nothing joins the keystroke path.

**Non-Goals (design-level):**

- Any drag that *moves* something. This design has one effect: text in the open page.
- Auto-scroll while dragging over a long document, and any drop-target styling.
- Dragging from a surface other than the two sidebar listings.
- Extending the existing OS-file drop's promise in ways this change does not already cover; the point is threaded through both paths only because they share one insertion call (D2).

## Decisions

### D1. The payload is a fact, not finished Markdown

The sidebar hands over what the row *is*; the editor derives the text:

```
  source row                      dataTransfer                      editor writes
  ---------------------------------------------------------------------------
  Assets: assets/2026/q3.pdf  ->  application/x-folio-asset       ->  linkForAsset(path)
                                  value = "assets/2026/q3.pdf"        [q3-report](assets/2026/q3.pdf)

  Pages:  "reading list"      ->  application/x-folio-page        ->  referenceToken(name,'word')
                                  value = "reading list"             #[[reading list]]
```

Two custom MIME types rather than one payload with a finished string, and rather than `text/plain`:

- A finished string in the payload would put the link rule in the sidebar, a component. It lives in `src/vault/link.ts` today precisely because three writers and one reader have to agree on it, and a fourth writer in the UI layer is how that agreement breaks.
- `text/plain` is worse than either: it makes the drop target the browser's text-drop machinery, whose output is literal characters — the exact reason `insertParsedMarkdown` parses instead of `insertText`-ing, and why `[x](a b.pdf)` would land unparsed. It would also leak the Markdown into any other drop target on the page.
- A fact also keeps the door open: the same payload could later mean something else in a different drop target without a second rendering rule.

The MIME types, the reader, and the one function that turns a payload into text live in one small module (`src/components/dragRefs.ts`), which imports the two vault-layer rules. Both callers — the sidebar's drag source and the pane's drop handler — go through it.

### D2. A drop lands at the drop point

`insertMarkdown` gains an optional point:

```
  insertMarkdown(markdown, { left, top })
       |
       v
  1. view.posAtCoords(point) --------- null? -----------------> caret, as before
       |
     { pos }
       v
  2. doc.resolve(pos).parent.canReplace(index, index, payloadContent)
       |                                        |
      fits? yes                                 no
       |                                        |
       v                                        v
  3. move the selection to that position     the caret, as before
       |
       v
  4. the existing three branches run unchanged, off the new selection
```

Step 2 is the whole safety property, and it is schema-driven rather than a list of node names: the payload is a real ProseMirror `Fragment` by then, so `canReplace` answers "can this land here" for a paragraph, a code block, or a doc-level boundary without this code knowing which is which. A position inside a code block cannot hold an image node, so it is refused and the caret is used — the page is never corrupted by a drop on a block that cannot take it.

Step 3 is a selection-only transaction. ProseMirror's history appends nothing for a transaction that does not change the document, so the drop is still one undo step, and the three existing branches run untouched — which is the point: the empty-paragraph and inline-unwrap rules that took a change of their own to get right are reused, not re-derived at a second insertion site.

Why a point on the existing method rather than a new `insertMarkdownAt`: one insertion path, one parse, one set of branches, and a caller that does not care which it got. The fake adapter records the point so tests can assert the difference.

The OS-file drop passes the same point. Its copy is asynchronous, so the point is captured at the drop and resolved when the link is written; a scroll during the copy resolves to whatever is under the pointer then. That is the accepted ceiling, and it is a plain `ponytail:` comment rather than machinery.

### D3. Draggability is decided by the rule that already decides it

The Assets section's rows are always draggable. A Pages row is draggable only when its name can be written as a token that reads back to that name:

```
  referenceToken(title, 'word')   ->  "#reading"        findReferenceRanges -> target "reading"   == title  -> draggable
                                  ->  "#[[weird]name]]" findReferenceRanges -> target "weird"     != title  -> not draggable
```

That predicate exists today as `suggest.ts`'s `insertable`, and it is the reason the completion popup never offers a page named `weird]name`. Dragging such a row would write `#[[weird]name]]`, which parses as a reference to a *different* page — a silent wrong answer in canonical Markdown, which is the worst kind. So the predicate moves to `src/vault/parse.ts` as `isReferenceable(name)`, beside the two functions it is composed from, and both the completion pool and the sidebar's row call it. One rule, two consumers, and the sidebar learns no new syntax.

The consequence is accepted and spec'd: a page row that cannot be dragged is not draggable, exactly as it is not offerable.

### D4. The drag source is two row closures, not a payload layer

Each listing's row already receives exactly what the payload needs — `path` in `renderAssetRow`, `page.title` in `renderRow`. So `draggable` and one `onDragStart` per row is the whole source side; no delegated handler, no `data-` attributes to parse, no new prop.

`Sidebar`'s memo contract is untouched: a drag source needs no app state and no callback from `App`, so nothing joined its prop list. The per-row closures allocate only when the sidebar re-renders, which is a graph or navigation change and never a keystroke, and the windowed listing bounds how many rows exist at once.

`effectAllowed = 'copy'` and a `dropEffect = 'copy'` on the pane's `dragover` are set so the cursor reads as a copy rather than a move — a drag here copies nothing, and the cursor should not claim otherwise.

### D5. No copy, no write, no index change

The drop handler branches before the file path:

```
  handleDrop(e)
    payload = readDragRef(dt)
    if (page === null) return                 // nothing anywhere, as today
    if (payload) { insertMarkdown(text(payload), point(e)); return }
    if (!onAttachFiles) return
    ... the existing copy-then-link path, now also passing point(e)
```

So the new gesture never reaches `copyDroppedFiles`, `writeBinary`, or the index. It writes the page's text and nothing else: no window opens (ADR-0021 is a *click* on a row, and a drag is not a click), no trail entry, no navigation, no derived data. The page's References section and backlinks pick the new reference up on the next scan, exactly as a pasted link's does.

### D6. One new ADR for the two things that outlive this change

`adr/0023-drops-land-at-the-drop-point.md` records (a) that a drop means the point it was released at, resolved against the document with a fallback rather than trusted, and (b) that a drag between surfaces carries the fact it names and lets the receiving layer derive the text. Both are seams other features will reuse — a future backlink drag, a tag drop, a calendar day — and neither is implied by ADR-0010 or ADR-0012 on its own. ADR-0021 and ADR-0022 are not revised: a row's click still opens, and an asset is still not a page.

## Risks / Trade-offs

- [A drop the schema refuses silently falls back to the caret] → accepted (D2): the alternative is guessing an insertion point, and "it went where the caret was" is a smaller surprise than a document that cannot accept the drop. The spec says so.
- [The OS-file drop's point is resolved after an async copy] → accepted, flagged with a `ponytail:` comment: asset copies are second-scale, and a scroll during one lands the link where the pointer is when the link is written.
- [A drag on a `<button>` row] → Chromium-first (ADR-0002), where `draggable` on a button is well-defined and a click that does not move still fires. The click path is asserted by test so a drag cannot quietly take it over.
- [Two MIME types the user can drag into another app] → accepted and harmless: an unknown `application/x-` type is ignored by receiving applications, and nothing in the payload is sensitive.
- [Sidebar rows gain attributes] → no keystroke cost: `draggable` and a handler are written when the sidebar renders, the listing is windowed, and the memo's prop list is unchanged, so a keystroke in the open page still skips the sidebar entirely.
