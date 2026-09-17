## Why

A vault's `assets/` folder is invisible in the app. An image renders in a page and Ctrl+Click opens a linked file (ADR-0021), but nothing lists what the vault holds, and a file no page links to — a PDF dropped in, a screenshot whose link was removed — cannot be reached from Folio at all. A page's images and attachments are missing from its Forwardlinks too, so the links pane describes only half of what a note points at.

## What Changes

- The sidebar gains an **Assets** section listing every non-hidden file under `assets/`, with a row label relative to that folder. Activating a row opens the file — the browser's own viewer for a type it displays, a download otherwise (ADR-0021). No app state changes: the open page stays open, and nothing joins the history trail.
- The sidebar becomes **banded**: all three section headers (Journal, Pages, Assets) are always in the document, Journal sizes to its calendar, and Pages and Assets share the remaining height with a scroll region each. Today a long Pages list buries anything below it, which is why the History section was removed in task 23.
- **Forwardlinks** lists a page's asset references beside its page references. Asset rows open the file; page rows navigate as they do now. The row is labelled with the filename, so a file reads the same in the sidebar and in the links pane.
- The **index** derives two new things while scanning: the vault's non-hidden file listing, used as the existence check for references, and each page's asset reference candidates — the vault paths its Markdown links and images target. References are derived, never persisted; a file deleted outside the app drops off the next refresh even when no page changed.
- An asset is defined by ADR-0022: a vault file that is **not a page**. Assets are read from the folder and linked from Markdown, and they never become page records. ADR-0021 is amended for the second gesture (a plain click on an asset row, alongside Ctrl+Click on a link).

## Capabilities

### New Capabilities

- `vault-assets`: what an asset is (a non-hidden file under `assets/`), how a page's asset references are derived from its Markdown links and images, how the Assets section lists them and opens one, and the negatives that keep assets out of everything page-shaped — no page record, not in search, not a `#` reference target, never editable, and opening one changing no app state.

### Modified Capabilities

- `ui-shell`: the sidebar's section contract becomes Journal, Pages, and Assets with a banded layout and internal scroll regions; the loading placeholders gain the Assets listing; the shell's "only the center pane scrolls" wording becomes each pane scrolling within itself.
- `static-navigation`: the Pages listing's window and scroll contract moves from the sidebar to the Pages section body; the links-pane requirement is scoped to page rows so asset rows can be specified separately; the no-folder state names all three sections.
- `vault-index`: "The assets folder is referenced, not navigated" is replaced by "no asset becomes a page" plus the newly derived data — the file listing, the asset inventory, and each page's asset references — and the refresh rules that keep them current.

## Non-goals

- No in-app viewer: no PDF, audio, or video rendering in a pane (ADR-0021 stands).
- No asset backlinks surface. The index derives a page's asset references, not the reverse, so "which pages use this image" has no UI in this change (ADR-0022 defers it deliberately).
- No editing, renaming, moving, deleting, pinning, tagging, or searching of assets.
- No reference-aware asset cleanup. The app still never deletes a file; the existing "won't do" decision stands.
- No change to the drop and paste flow's destination or naming, and no change to how a markdown link opens in the editor.
- No new `VaultStorage` operation, no persistence, no backend.

## Impact

- Vault layer: `src/vault/index.ts` (graph shape, asset inventory, per-page references), `src/vault/parse.ts` (destination extraction), new `src/vault/assetOpen.ts`, `src/editor/assetImages.ts` and `src/editor/inlineDecorations.ts` (imports only).
- UI: `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/Accordion.tsx`, `src/components/MetaPanel.tsx`, and their CSS modules.
- Specs: `vault-assets` (new), `ui-shell`, `static-navigation`, `vault-index`.
- Docs and build identity: ADR-0022 (new), ADR-0021 (amended), `PLAN.md` (new numbered task, and a revision note on task 23's "the sidebar is still the only scroll region"), `package.json` 0.9.2 → 0.10.0.
- No new dependencies, no storage-contract change, no persisted state.
