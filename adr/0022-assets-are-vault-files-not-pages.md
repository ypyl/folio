# ADR-0022: Assets are vault files, not pages

- Status: Accepted
- Date: 2026-09-17

## Context

A page references a file in its own vault with an ordinary Markdown link — `![shot](assets/shot.png)`, `[Q3 report](assets/q3-report.pdf)`. The app already handles that at the edge: the pane resolves an image's bytes in place (`render-vault-images`), and Ctrl+Click on a link opens the file as a derived copy (ADR-0021). The index never saw assets at all. `assets/` was excluded from the page scan, and the only code that knew the folder existed was the write path (`copyDroppedFiles`) and the listing it reads to name a dropped file uniquely.

That left assets invisible as a collection. There was no way to see what a vault holds, no way to open a PDF no page links to, and no signal that a page's images and attachments are part of the note.

The obvious shortcut is to make an asset a page: mint a record for `assets/shot.png`, let it appear in a page list, collect its backlinks, give it a view. Logseq's asset pages are close to this, and it would pay for the whole feature with machinery that already exists.

What refuses it is everything a page already carries. A page has a name in the reference namespace (so `#[[shot]]` would resolve), a place in the search corpus, a pin, an entry in the links pane, a synthesized blank body when no file exists, draft state, and a Markdown editor over its content. An asset is bytes the app must never interpret. Giving it a page record means either teaching every one of those mechanisms to exclude it, or accepting nonsense: a searchable binary, a pins entry for a PNG, an autosave writing text over a PDF.

ADR-0021 already settles the one thing a page view would have provided that is genuinely missing — how an asset opens — and it settles it without a viewer.

## Decision

An asset is a file in the vault that a page references by path, and it is not a page.

- The **inventory** comes from the folder: every non-hidden file under `assets/`, listed in the sidebar's Assets section. `assets/` remains where the app writes dropped and pasted files.
- The **references** come from the Markdown: every inline link or image destination that names a vault path, percent-decoded and deduplicated, is a reference of that page. A page's Forwardlinks lists them beside its page references, and activating one opens the file.
- Activating an asset — from the sidebar section or from a Forwardlinks row — opens it exactly as a link does (ADR-0021): a `blob:` window for a type the browser displays, a download otherwise, the vault file never written and never watched.
- An asset **never** gets a page record. It does not enter the reference namespace, search, the pins file, the unmaterialized-page flow, or the editor. The app does not edit, rename, or delete one.
- Asset references are derived data, like backlinks: built in memory when the folder is opened and refreshed with it, never persisted (ADR-0001, ADR-0004).

Rejected: **assets as pages.** It would have supplied the sidebar row, the backlinks, and the links row from existing code, at the price of a binary file in the reference namespace, in search, in pins, and in the draft store. It also needs a view ADR-0021 refuses, leaving a page whose body is a file it must not edit.

Rejected: **a persisted asset catalog** (a `.folio/assets.md` listing the folder). One more derived artifact to keep in sync with the filesystem, for data the folder listing and the pages' own Markdown already produce.

Rejected: **only referenced assets.** Listing just the files some page links to would hide orphans, and the folder, not the link graph, is this app's source of truth.

## Consequences

- "Which pages use this asset" is computable from the index but not surfaced: with no asset view, there is nowhere to show an asset's backlinks. Deliberately deferred. The per-page reference group already exists, so the reverse fold is a few lines once a surface does.
- The Assets section shows orphans — files under `assets/` no page references. That is the honest reading of "the folder is the database", and it makes them visible to clean up by hand. The app still never deletes a file ("reference-aware asset deletion: won't do" stands).
- `assets/` stays a convention, not a schema. A vault keeping its images elsewhere still renders and opens them, because the pane and the open gesture resolve any vault-relative path; those files simply do not appear in the Assets section, which mirrors one folder.
- Assets cost the index one regex pass per page it reads and one derived listing per scan: no reads of asset bytes, no extra `stat`, nothing on the keystroke path.
- A later feature wanting asset tags, asset search, or asset renaming has to revise this record rather than extend it, because each of those wants the page-record machinery this decision refuses.
