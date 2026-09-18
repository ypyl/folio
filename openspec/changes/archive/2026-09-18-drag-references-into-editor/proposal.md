## Why

Every way a page can gain a reference to something the vault already holds is a *typed* gesture. A page reference needs `#` or `#[[` plus completion; a file reference needs `[label](` plus completion, and before `add-asset-references` it needed the whole destination typed by hand. Both work, and both ask the user to know the syntax and spell a name before the app will help. Meanwhile the two listings that show exactly what the vault holds, Pages and Assets, sit in the same window, and a row there does one thing: activate.

`add-asset-references` closed its own non-goals with "no draggable rows … insertion happens where the reference is written: in the editor, at the caret." That left the discoverable path as: see the file in the sidebar, then reproduce its name in the editor as Markdown. Dragging the row to the spot where the reference belongs is the gesture a user reaches for anyway, and it needs no syntax knowledge at all.

The second half of the why is positional. `insertMarkdown` writes **at the caret**, so a drop does not mean what its name means: the user aims at a paragraph and the link lands wherever the caret last was. A gesture whose whole point is "put it *here*" has to land where the pointer is.

## What Changes

- **Sidebar rows become drag sources.** An Assets row carries the file's vault path; a Pages row carries the page's title. The row carries the *fact*, never finished Markdown, so the sidebar learns no syntax.
- **The editor derives the text from the existing rules.** `linkForAsset(path)` (`src/vault/link.ts`) and `referenceToken(title, 'word')` (`src/vault/parse.ts`) already decide how a vault file and a page are written. Both are already shared across layers. The drop handler — already the seam where an incoming thing becomes Markdown — calls them, so no new text rule exists and the reference grammar (ADR-0012) and the escaping rule are untouched.
- **No copy, no write.** The file is already in the vault, so this path never reaches `copyDroppedFiles` or `writeBinary`. The dropped reference changes only the page's text.
- **A drop lands at the drop point.** `insertMarkdown` gains an optional viewport point; the editor resolves it with `view.posAtCoords` and inserts there, falling back to the document's end when the point names nothing. **BREAKING** for the spec only: `page-editing` currently promises "at the cursor", and dropped *files* get the same fix, so an OS-file drop also lands where it was aimed.
- **Dropping into the page is the only thing a drag does.** No reordering, no moving a page, no cross-vault drag.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: the drop requirement is reworded from the caret to the drop point, and a new requirement states what a reference dragged from the sidebar writes and that it changes nothing else.
- `vault-assets`: an Assets row is a drag source carrying the file's vault path, and dropping it writes a reference instead of opening the file (ADR-0022's row semantics are preserved, not replaced).
- `page-references`: a Pages row is a drag source carrying the page's title, written as the canonical token the lexical-forms rule already defines.

## Non-goals

- **No drag-to-move and no drag-to-reorder.** Nothing in the vault is renamed, moved, or reordered; a drag writes text into the page and does nothing else. Dragging a page row does not open, pin, or navigate to it.
- **No rows beyond the two listings.** Journal-calendar days, the References and Forwardlinks rows in the meta panel, and search-result rows are not drag sources.
- **No new gesture for opening.** A plain click on an asset row still opens the file (ADR-0021); a drag is a separate gesture and a click that does not move is still a click.
- **No cross-vault drag**, and no drag between two folders' sidebar listings.
- **No auto-scroll while dragging** over a document longer than the pane, and **no custom drag ghost** or drop-target styling: the browser's own drag image and copy cursor are used.
- **No new reference form, no new syntax, no `@`, no `![[..]]`.** A dropped page writes exactly what accepting a completion row writes.
- **No anchor mapping across an async drop.** A dropped OS file is copied first and linked after; the point is re-resolved when the link is written, so a scroll during the copy resolves to what is under the pointer then.
- **No fix for names the reference grammar cannot tokenize** (a page whose title holds `]]`), which the typed completion path shares.
- **No new `VaultStorage` operation, no persistence, no backend, no dependency.**

## Impact

- `src/components/EditorPane.tsx` — one payload branch in `handleDrop` beside the existing files path; both paths pass the drop point.
- `src/components/dropAssets.ts` — the payload type constants and reading them off a `DataTransfer`.
- `src/editor/editor.ts` — `insertMarkdown(markdown, point?)`; no new interface method.
- `src/editor/milkdown.ts` — resolve the point to a document position, guard a position that cannot hold inline content, and thread it through `insertParsedMarkdown`.
- `src/editor/fakeEditor.ts` — record the point a test asserted.
- `src/components/Sidebar.tsx` — one delegated `onDragStart`, `draggable` and a payload attribute on the two kinds of row. No new prop, so the memo contract is untouched.
- `src/App.test.tsx`, `src/components/EditorPane.test.tsx`, `src/components/Sidebar.test.tsx`, `src/editor/milkdown.test.ts` — the gesture end to end and the fallbacks.
- Specs: `page-editing`, `vault-assets`, `page-references` (deltas). In scope of ADR-0010 (the drop seam and the editor/vault boundary), ADR-0012 (no third reference form), ADR-0021 and ADR-0022 (what an asset row is and what activating it does). New ADR-0023 records the drop-point rule and the fact/payload split. `PLAN.md` gains one numbered task, and `package.json` 0.12.0 → 0.13.0.
- No index change, no derived data, and nothing on the keystroke path: a drag is a pointer gesture, and the sidebar's rows gain attributes rather than work.
