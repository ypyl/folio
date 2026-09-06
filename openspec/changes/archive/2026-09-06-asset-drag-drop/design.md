## Context

PLAN.md task 8. The editor pane is a pure presentation component (receives `initialContent`/`onChange`, owns no filesystem access — ADR-0010); `VaultStorage` is the only path to disk (ADR-0003, ADR-0013); the index scans `.md` files via a single predicate (`scanScope`). `VaultStorage.write` is text-only, though FSA's `writable.write` already accepts raw bytes. Milkdown exposes `editor.action(ctx => …)` + `editorViewCtx` — the same hook `setContent` uses — for programmatic edits.

## Goals / Non-Goals

**Goals:**
- Dropped files land in the vault (`assets/`, unique names) and render as markdown links at the caret, feeding the normal autosave path.
- All disk access stays behind `VaultStorage`; the editor layer stays clean of filesystem knowledge.

**Non-Goals:**
- Asset display/rendering (broken-image `<img>` until a future renderer; see D2 and proposal Non-goals).
- Recursive folder drops, progress UI, drag-over visuals.

## Decisions

**D1 — `VaultStorage.writeBinary(path, blob)` sibling.** Text `write` stays strict; binary assets get their own method (`FileSystemVaultStorage` passes the blob straight to FSA's `writable.write`; fakeHandle parity added for tests). Chosen over broadening `write` (`string | Blob`) — keeps the ADR-0013 `content` contract meaning text — and over base64-through-`write` — ~33% bloat. A future asset renderer will want `readBinary` as its natural pair.

**D2 — Link-only, no display.** `![..]` renders as a broken image until a separate feature resolves `assets/` to blob URLs. The link is the durable on-disk artifact; rendering is presentation over it (ADR-0001). Keeps task 8's PLAN wording exactly; the smoke test explicitly verifies the *link* lands, not the image.

**D3 — Files-only.** `dataTransfer.files` entries are copied; directories (webkitGetAsEntry) are silently ignored.

**D4 — Sequential multi-copy.** Loop over the files; copy one at a time through `writeBinary`; insert one link per successfully copied file at the caret. Partial failure: no link for a failed copy. Sequential (not parallel) copies avoid naming races and keep error handling linear.

**D5 — Pane-level `dragover`/`drop` preventDefault.** Attached at the pane (`<main>`) for both states; copy+insert only when `page !== null`. Dropping on the empty state is a clean no-op and never navigates the app (browser default would open the file in the tab). No hint UI.

**D6 — `assets/` excluded from `scanScope`.** One clause in the index's scan predicate: any path whose first segment is `assets/` is rejected. The incremental watcher reuses the same predicate, so it inherits the exclusion. The folder name becomes part of the ADR-0013 path contract — noted there, no new ADR.

**D7 — Insert raw markdown through the adapter.** `EditorAdapter` gains `insertMarkdown(markdown)`; MilkdownAdapter implements it as `view.state.tr.insertText(markdown)` at the current selection inside `editor.action`. The commonmark parser normalizes the inserted text into the image/link node, and the existing `markdownUpdated` listener feeds the pane's draft/save pipeline with zero extra wiring (ADR-0008). The pane calls it only after each copy resolves; the caret position is re-read at insert time.

**D8 — Monotonic collision counters.** Copy flow takes one `storage.list('assets')` snapshot per drop batch, then resolves each file to the first free `name[.ext]`, `name-1[.ext]`, `name-2[.ext]`, … against that snapshot, tracking names already claimed within the batch. Sequential copies make the snapshot accurate. (N2 timestamp/hash rejected: ugly names leak into the inserted link text.)

**Seam — `onDropFiles(files) => Promise<string[]>` prop on EditorPane.** The pane owns the drop events and insertion; App/useVault owns the copy loop (resolving unique names, calling `writeBinary` on the active folder's storage) and returns the landed paths. The pane's only new duty: hygiene (`preventDefault`) + calling `insertMarkdown` per path. Filesystem stays behind the seam.

## Risks / Trade-offs

- [Dropped images look broken until a renderer exists (D2)] → Accepted; flagged in the feature's smoke test as expected behavior, and the data written (the `.md` link + the asset) is exactly what the future renderer needs.
- [One batch listing snapshot can race another drop batch] → Sequential copies and per-batch claimed-name tracking make same-batch collisions correct; cross-batch races are second-scale and acceptable at asset scale (ponytail: single writer today, per-batch mutex if concurrency ever appears).
- [Hard-coding `assets/` in the scanner (D6) couples index logic to a convention] → Accepted; the convention is already fixed by this change and matches EveryNote's "attachments folder" mental model.