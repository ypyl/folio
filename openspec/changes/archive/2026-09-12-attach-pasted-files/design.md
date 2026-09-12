## Context

See `proposal.md` for why. Facts that shape the approach:

- `EditorPane` already owns both gestures' primitives: `handleDrop` calls `onDropFiles(files)` (a closure over `activeFolder.storage` from `App`) and then `adapterRef.current.insertMarkdown(linkForAsset(path))` per landed path. The drop handlers sit on both `<main>` states and `preventDefault` so the browser never navigates.
- `collectDropFiles(dt: DataTransfer)` filters `kind === 'file'` entries and skips directories through `item.webkitGetAsEntry?.()` — optional-called, so a `DataTransfer` without that member (a clipboard's) works unchanged.
- `ClipboardEvent.clipboardData` is a `DataTransfer`, and React's `onPaste` fires on the pane's `<main>` while ProseMirror's own paste handling runs earlier, on the editor's DOM inside it.
- `MilkdownAdapter`'s `handlePaste` reads the app's private Markdown flavor and `text/plain` only, and its comment records the intent: "A clipboard with no text (copied files) falls through to the default handler."
- `copyDroppedFiles` (`src/vault/assets.ts`) owns unique naming (`name`, then `stem-1`, `stem-2`, …) and returns only the paths that landed; `linkForAsset` picks `![…]` or `[…]` from the *path's* extension.
- The pane is tested against `FakeEditor` (`src/editor/fakeEditor.ts`), which mirrors the block DOM; jsdom has no `DataTransfer`, so the existing drop tests pass a plain object with `items` and `files`.

## Goals / Non-Goals

**Goals:**

- One intake path for both gestures; no second copy of the copy-and-link logic, no new storage or index behavior.
- Pasting a screenshot attaches it and it renders, with a name a human can find later.
- Text paste, drop, and the placement rules stay exactly as they are.

**Non-Goals:**

- No change to text paste, drop, the unique-name rule, or the asset link shapes.
- No image processing: no resizing, no re-encoding, no thumbnail, no de-duplication by content hash.
- No clipboard read: the app only reacts to the user's paste gesture.
- No handling of clipboards that carry an image as markup rather than a file (see the proposal's out-of-scope note).

## Decisions

### D1 The paste handler lives in the pane, beside the drop handler

`EditorPane` gains `handlePaste`, reading files through the same collector and running the same copy-then-insert sequence as `handleDrop`, under the same prop. The move is symmetric with drop and needs no new seam: `App` already hands the pane a function that copies files into the vault.

Rejected: a file branch inside `MilkdownAdapter.handlePaste`. The adapter is the editor seam (ADR-0010) and knows nothing about vaults; it would need the copy flow passed through the seam, and the pane would then have two different places that attach assets.

Rejected: an app-level paste listener on the window. It would attach files when the caret is nowhere near the editor, and it can't insert at the caret as directly as the adapter call the drop path already uses.

### D2 Files only when there is no text, decided by the clipboard's content

The handler returns early unless the clipboard carries at least one file, and again when `text/plain` is non-empty, leaving every text paste to the editor. The rule reads the clipboard rather than the event's state, so Folio's behavior does not depend on whether ProseMirror happens to have called `preventDefault` before the event bubbles to the pane.

Rejected: keying off `event.defaultPrevented`. It couples this branch to another library's internal call pattern, and would break silently on a Milkdown upgrade.

Rejected: attaching files whenever present, text or not. A spreadsheet selection or a rich-text copy can carry both, and the text is what the user meant; the file is clipboard scaffolding.

### D3 A generic clipboard name becomes a timestamped one

Chromium hands a clipboard bitmap over as `image.png` (or `blob` for a nameless one), so the copy flow's unique-name rule would produce `image.png`, `image-1.png`, `image-2.png` — technically unique, practically unfindable. A pasted file whose stem is generic (`image`, `blob`, `clipboard`, or empty) is renamed `pasted-YYYYMMDD-HHMMSS` in local time, with the extension kept from the name or derived from the MIME subtype when the name has none (an extension matters: `linkForAsset` decides image-versus-plain-link from the path's extension, so a name without one would attach a bitmap as a plain link and it would never render). Any other name is kept: a copied PDF is `Q3 report.pdf`.

The rename is applied by wrapping the `File` (`new File([file], name, { type: file.type })`) before intake, so the copy flow, its uniqueness rule, and its failure handling are untouched.

Rejected: always renaming. A copied file's name is information the user chose; a timestamp would throw it away.
Rejected: keeping the clipboard name and letting the counter run. The vault becomes a pile of `image-N.png` with no way to tell which screenshot is which.

### D4 Uniqueness, failure, and rendering are inherited

Two screenshots pasted in the same second still get distinct names through the existing rule (`pasted-20260912-213045.png`, then `-1`), a failed copy yields no link because the intake returns only what landed, and the inserted reference renders through `render-vault-images`' pass, which the insertion triggers as an ordinary document change. No new machinery.

### D5 The prop and collector are renamed, not duplicated

`onDropFiles` becomes `onAttachFiles` and `collectDropFiles` becomes `collectFiles`, because both gestures now feed them; leaving the drop names in place would describe only one of the two callers. This is a rename in `App`, the pane, and the pane's tests — no behavior change and no new prop.

## Risks / Trade-offs

- [A clipboard that carries both a screenshot and text does not attach the screenshot] → Deliberate (D2): the text is what such a clipboard means. The user's gesture for a screenshot-only clipboard is unaffected, and that is the reported case.
- [An attach that lands while the user has typed elsewhere inserts at the current caret] → Same behavior as a drop today; the insertion goes through the normal edit path, so the draft and the file stay consistent.
- [Two pastes within one second collide on the timestamp] → The unique-name rule numbers the second one, as it does for identical dropped file names.
- [A pasted file whose clipboard name is generic but whose content is not a screenshot (e.g. a copied PDF handed over as `blob`)] → It is still named from the paste time with its own extension, which is the intended floor: no extension is ever invented, and the link shape follows the real extension.

## Migration Plan

None. No persisted state, no storage or index change.
