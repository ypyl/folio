## Why

A page can only gain a reference to a file already in the vault by dragging that file in from the operating system or pasting it: there is no way to name a file that is already on disk. Delete a link and the asset becomes unreachable from the page it belonged to — you can see the orphan in the sidebar's Assets section and you still cannot put it back without leaving the editor for a file manager or typing the whole Markdown destination by hand. Page references have had completion since `add-reference-autocomplete`; asset references have none.

An asset reference is not a reference token and must not become one (ADR-0012, ADR-0022). Its canonical form is an ordinary Markdown link — `[Q3 report](assets/q3-report.pdf)` — and that form is the address. What is missing is not syntax but completion for the destination being typed.

## What Changes

- **A vault-file picker at the link destination.** While the caret is inside an inline link's or image's destination (`[Q3](q3|`, `![shot](sh|`), the editor offers the vault's files, ranked and filtered by what has been typed, and inserts the chosen file's path on accept. The trigger is Markdown's own destination position: no new sigil, no new on-disk syntax, and the reference grammar (ADR-0012) is untouched.
- **The picker stays silent until it is relevant.** No popup on the empty destination, and no popup when nothing matches; a scheme (`https:`), a fragment (`#section`), an absolute path, or a query matching no file shows nothing. Ordinary link typing is unaffected.
- **The typed syntax decides the inserted form.** `[` inserts a link, `![` inserts an image, and an empty label is filled with the file's name — the same label rule drop and paste already use. The destination is the file's vault-relative path.
- **Written destinations become readable Markdown.** `linkForAsset` currently writes the raw path, so a file named `Q3 report.pdf` produces `[Q3 report](assets/Q3 report.pdf)`, which no Markdown parser reads as a link: the index sees an asset reference while the editor has no anchor to open. The destination is escaped before it is written, by the one helper all three writers (drop, paste, picker) use.
- **No new surface.** The existing completion popup hosts both kinds of row and the existing keys (`ArrowUp`/`ArrowDown`, `Enter`/`Tab`, `Escape`) apply unchanged.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `vault-assets`: a page can gain a reference to an existing asset without a drop or a paste — the destination-completion requirement, its trigger and its guards, what the accepted row inserts, and the negatives that keep it out of the reference namespace.
- `page-editing`: the text drop and paste write for a vault file is escaping-correct, so any file name produces a Markdown link the editor and every other Markdown reader can follow; both existing insertion requirements change, and the escaping rule gets its own requirement.

## Non-goals

- **No new reference syntax.** No `@name`, no `![[file]]`, no `[[file]]`, no `/` command. `page-references` keeps exactly two lexical forms and `[[Page]]` keeps rendering as literal text with no picker.
- **No asset pages.** An asset still produces no page record, no search content, no backlink entry, no pin, and no editor content (ADR-0022). A picker row is not an entry in the reference namespace.
- **No new gesture for opening, and no viewer.** Picking a file never opens it; activating a row in the sidebar or in References still opens the file and changes nothing else (ADR-0021).
- **No sidebar or meta-panel action.** No "add to page" control on an asset row, and no draggable rows. Insertion happens where the reference is written: in the editor, at the caret.
- **No chord.** No keyboard binding for opening the picker; `keyboard-shortcuts-help` gains no row.
- **No asset backlinks, search, rename, move, or deletion**, and no reference-aware cleanup ("won't do" stands).
- **No change to the reference picker.** Page-name completion keeps its pool, its ranking, and its two inserted forms.
- **No new `VaultStorage` operation, no persistence, no backend, no dependency.**

## Impact

- Vault layer: `src/vault/parse.ts` (the destination trigger, beside `referenceTrigger`), `src/vault/suggest.ts` (the file candidate pool; the ranker itself is already shape-generic and unchanged).
- Editor layer: `src/editor/referenceSuggest.ts` (one plugin, two triggers, two accept shapes), `src/editor/editor.ts` (the adapter's source seam gains the file source).
- UI: `src/components/EditorPane.tsx` (wiring), `src/components/dropAssets.ts` (the escaping helper `markdownDestination`, used by `linkForAsset`), `src/App.tsx` (the memoized file pool and the source).
- Specs: `vault-assets`, `page-editing` (deltas).
- Docs and build identity: no ADR is needed — the change adds no reference form and revises no architectural decision; ADR-0022's negatives are preserved, and `design.md` records why `](` beat a sigil and a chord. `PLAN.md` gains one numbered task. `package.json` 0.11.0 → 0.12.0.
- No index change: `parseAssetPaths` already derives a page's asset references from exactly the paths the picker offers, so a picked link appears in the page's References section on the next scan with no new derived data and no persistence.
