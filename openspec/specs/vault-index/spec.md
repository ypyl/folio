# vault-index Specification

## Purpose

Builds and maintains Folio's in-memory graph of pages and page references from an opened vault folder, so the sidebar, editor, and (later) backlinks and search read from a live index over the user's Markdown files instead of mock data.

## Requirements

### Requirement: The index derives pages from the vault folder
Walking a vault folder SHALL produce one page per Markdown file under the `pages/` subfolder or the `journals/` subfolder, at any depth within those directories. A path SHALL become a page only when it ends in `.md` (case-insensitive), no path segment begins with `.`, and the path is within `pages/` or `journals/`; all other files, hidden paths, and Markdown files outside those directories SHALL NOT produce pages. A Markdown file under `pages/` whose filename stem is a valid calendar date in zero-padded `YYYY-MM-DD` form SHALL NOT produce a page, at any depth; it is excluded the same way hidden paths and `assets/` files are. The index SHALL be rebuilt when a folder is opened and refreshed afterward (see external-change requirements).

#### Scenario: A Markdown file becomes a page
- **WHEN** a vault contains `pages/Welcome.md`
- **THEN** the index contains a page for `pages/Welcome.md`

#### Scenario: Nested Markdown files are pages
- **WHEN** a vault contains `pages/projects/ideas.md`
- **THEN** the index contains a page with the vault-relative path `pages/projects/ideas.md`

#### Scenario: Root-level Markdown files are not pages
- **WHEN** a vault contains `Welcome.md` at the root
- **THEN** it does not appear in the index as a page

#### Scenario: Markdown files outside pages/ and journals/ are not pages
- **WHEN** a vault contains `notes/random.md`
- **THEN** it does not appear in the index as a page

#### Scenario: Non-Markdown files do not become pages
- **WHEN** a vault contains `pages/image.png`, `pages/notes.txt`, and `pages/README`
- **THEN** none of them appear in the index as pages

#### Scenario: Upper-case extension is a page
- **WHEN** a vault contains `pages/NOTES.MD`
- **THEN** it is indexed as a page

#### Scenario: Hidden paths do not become pages
- **WHEN** a vault contains `.obsidian/plugins/x.md` and `.hidden.md` at the root
- **THEN** neither path appears in the index as a page

#### Scenario: A date-named file under pages/ is not a page
- **WHEN** a vault contains `pages/2026-09-16.md`
- **THEN** the index contains no page for it, and it appears in no listing, search result, or backlink set

#### Scenario: A nested date-named file under pages/ is not a page
- **WHEN** a vault contains `pages/notes/2026-09-16.md`
- **THEN** the index contains no page for it

#### Scenario: A date-named file under journals/ is the journal day
- **WHEN** a vault contains `journals/2026-09-16.md`
- **THEN** the index contains the journal day page for 2026-09-16

#### Scenario: An ignored file's references do not contribute to backlinks
- **GIVEN** a vault containing `pages/2026-09-16.md` whose content references `#Roadmap`
- **WHEN** the vault is scanned and indexed
- **THEN** `Roadmap`'s backlinks do not include that file

### Requirement: Pages have a name, kind, and path
Every page SHALL have a title equal to its filename with the final `.md` removed, a kind of `journal` when its path starts with `journals/` and `page` when its path starts with `pages/`, a vault-relative path that is its stable identity, and a last-modified time equal to the file's `lastModified` value at scan time. A page SHALL be identified by its path, not by its title.

#### Scenario: Title comes from the filename stem
- **WHEN** a vault contains `pages/reading list.md`
- **THEN** the page title is `reading list`

#### Scenario: Multi-dot filename stem
- **WHEN** a vault contains `pages/draft.v2.md`
- **THEN** the page title is `draft.v2` (only the final `.md` is removed)

#### Scenario: Journal entries are detected by directory
- **WHEN** a vault contains `journals/2026-09-02.md` and `pages/notes.md`
- **THEN** the journal page has kind `journal` and the notes page has kind `page`

#### Scenario: A root file named like the directory is not a journal
- **WHEN** a vault contains `journals.md` at the root
- **THEN** it is not a journal and, like every other root-level Markdown file, it is not indexed as a page

#### Scenario: A page carries its last-modified time
- **WHEN** the index scans a vault whose file `pages/Ideas.md` reports `lastModified` `T1`
- **THEN** the index's page for `pages/Ideas.md` carries `T1` as its last-modified time

### Requirement: The index extracts page references from page content
The index SHALL extract from each page's content every page reference written in Folio's two forms (`#word` where `word` is letters, digits, `_`, `-`; and `#[[Page name]]`), recording for each the referenced page name and the lexical form used. Repeated references to the same page within one file SHALL be recorded once. Forms that are not Folio references (including plain `[[Page]]` wikilinks) SHALL NOT be extracted.

#### Scenario: Both reference forms are extracted
- **WHEN** a page contains `See #Inbox and #[[reading list]]`
- **THEN** the index records references to `Inbox` (via `word`) and `reading list` (via `bracketed`)

#### Scenario: Duplicate references collapse
- **WHEN** a page contains `#Folio` twice
- **THEN** the index records a single reference to `Folio`

#### Scenario: Non-reference forms are ignored
- **WHEN** a page contains `[[Inbox]]` and `#tag/word`
- **THEN** neither is recorded as a reference

### Requirement: References resolve to pages case-insensitively
A reference SHALL resolve to a page whose filename stem matches the referenced text ignoring letter case; case does not change the resolution, only the on-disk stem is canonical for display. A reference to a page that does not exist in the vault SHALL remain a valid reference (the index records it, and no page is required to exist). When multiple pages differ only by case, the one whose path sorts first SHALL win resolution. A reference whose name is a valid calendar date in zero-padded `YYYY-MM-DD` form SHALL NOT resolve to a path under `pages/`; it resolves to the journal day `journals/<date>.md` when that page exists, and otherwise names that journal day.

#### Scenario: Reference matches a page regardless of case
- **WHEN** the vault contains `Folio.md` and a page references `#folio` and another references `#FOLIO`
- **THEN** both references resolve to the page `Folio`

#### Scenario: Reference to a missing page is valid
- **WHEN** a page references `#[[feature roadmap]]` and no such file exists
- **THEN** the index still records the reference, and no page is created for it

#### Scenario: Case-only collision picks the first path
- **WHEN** the vault contains both `Project.md` and `project.md`, and a page references `#project`
- **THEN** the reference resolves to the page whose path sorts first of the two

#### Scenario: A date name resolves to the journal day
- **WHEN** the vault contains `journals/2026-09-16.md` and a page references `#[[2026-09-16]]`
- **THEN** the reference resolves to `journals/2026-09-16.md`

#### Scenario: A date name never resolves under pages/
- **GIVEN** a vault containing `pages/2026-09-16.md`
- **WHEN** a page references `#[[2026-09-16]]`
- **THEN** the reference names `journals/2026-09-16.md`, not the `pages/` path

### Requirement: The index provides backlinks
For every page that is the target of any reference, the index SHALL provide the set of pages that reference it, however the reference is written. A page SHALL NOT be counted as linking back to itself. The index SHALL provide, per page, its own outgoing references.

#### Scenario: Backlinks include every referencing form
- **WHEN** `a.md` contains `#Topic` and `b.md` contains `#[[Topic]]`
- **THEN** `Topic`'s backlinks include both `a.md` and `b.md`

#### Scenario: A page does not backlink itself
- **WHEN** `Topic.md` contains `#Topic`
- **THEN** `Topic`'s backlinks do not include `Topic.md`, though `Topic.md`'s outgoing references still include `Topic`

#### Scenario: Outgoing references are per page
- **WHEN** `a.md` contains `#One #Two`
- **THEN** the index reports `a.md`'s outgoing references as `One` and `Two`

### Requirement: The index holds page content
The index SHALL retain the full text content of every page it indexes, so opening a page requires no additional folder access. When a page's content changes, the index SHALL serve the current content.

#### Scenario: Content is available from the index
- **WHEN** a page is open and the editor pane displays its body
- **THEN** the body text matches the page's file content, read from the index

### Requirement: External folder changes reach the index
Changes made to the vault folder outside the app SHALL appear in the index without restarting the app: the index SHALL refresh when the window gains focus, when it becomes visible, and periodically while it is visible. After a refresh, the index SHALL match the folder: added pages appear, removed pages disappear, and changed pages carry updated content and references. The same refresh SHALL re-derive the asset inventory and re-check the existence of every page's asset references, so a file added, removed, or changed under `assets/` is reflected without any page being edited.

#### Scenario: A file added externally appears
- **WHEN** a file `New.md` appears in the folder while the app is open, and the window later gains focus
- **THEN** `New.md` appears as a page in the index

#### Scenario: A file changed externally updates links
- **WHEN** `Ideas.md` gains a reference to `#Roadmap` while the app is open, and a refresh occurs
- **THEN** the index records `Roadmap` in `Ideas.md`'s outgoing references and `Ideas.md` in `Roadmap`'s backlinks

#### Scenario: A file removed externally disappears
- **WHEN** `Old.md` is deleted from the folder while the app is open, and a refresh occurs
- **THEN** `Old.md` no longer appears in the index or the sidebar

#### Scenario: An asset added externally is inventoried on refresh
- **WHEN** a file is copied into `assets/` while the app is open, and a refresh occurs
- **THEN** the vault's asset inventory contains the new file, and no page was created, moved, or removed

### Requirement: The index follows the active folder
The app SHALL bind its index to the currently active vault folder: opening or switching to a folder SHALL build that folder's index, and the sidebar and editor SHALL show that folder's pages. With no folder open, no index SHALL be shown.

#### Scenario: Opening a folder builds its index
- **WHEN** a folder is picked and opened
- **THEN** the sidebar lists that folder's pages instead of sample data

#### Scenario: Switching folders swaps the index
- **WHEN** the user activates a second folder while one is open
- **THEN** the sidebar lists the second folder's pages, replacing the first folder's

### Requirement: The index absorbs the app's own writes
A page saved by the app SHALL reach the index immediately, without waiting for a diff-rescan: the page's content and parsed references SHALL update in memory as soon as the save succeeds, the backlink entries affected by the page's references SHALL be re-derived, and the index's change snapshot SHALL be updated for that page so the next refresh does not re-read it. A save that failed or never ran SHALL leave the index unchanged.

#### Scenario: A saved edit is visible immediately
- **WHEN** a page's edited content is saved successfully
- **THEN** the index holds the new content and the re-parsed references for that page, without any refresh

#### Scenario: Backlink entries re-derive from the edit
- **WHEN** a saved edit adds or removes a reference to another page
- **THEN** that target's backlink list reflects the edited page's new links immediately

#### Scenario: The next refresh skips the written file
- **WHEN** a diff-rescan runs after a page was saved by the app
- **THEN** that page is not re-read, because its change snapshot matches the file's current state

#### Scenario: A failed save leaves the index unchanged
- **WHEN** a save fails
- **THEN** the index still holds the page's previous content and references

### Requirement: The index exposes an ordered pins list from the vault meta file
Reading a vault SHALL expose an ordered list of page paths derived from the vault's hidden pin meta file — `.folio/pins.md` — in the file's own order, with the most recently pinned page first. The meta file SHALL NOT be indexed as a page: it produces no page record, no search content, and no reference source. When the meta file is absent, the pins list SHALL be empty. Refresh SHALL re-derive the pins list when the meta file changes, exactly as page records re-derive for changed files, so external edits take effect on the app's next scan.

#### Scenario: Pins are read from the meta file in file order
- **WHEN** a vault's `.folio/pins.md` lists `b.md` then `a.md`
- **THEN** the index exposes pins `['b.md', 'a.md']` in that order

#### Scenario: A vault without the meta file has no pins
- **WHEN** a vault has no `.folio/pins.md`
- **THEN** the index exposes an empty pins list

#### Scenario: The meta file is not a page
- **WHEN** a vault has `.folio/pins.md`
- **THEN** the index contains no page for `.folio/pins.md`

#### Scenario: An external change to the meta file is picked up on refresh
- **GIVEN** an index built when `.folio/pins.md` listed `a.md`
- **WHEN** another tool rewrites it to list `b.md` first and a refresh occurs
- **THEN** the refreshed index exposes pins `['b.md', 'a.md']`

### Requirement: No asset becomes a page
No file under the vault's `assets/` folder SHALL produce a page, whatever its extension or name: it SHALL NOT appear among the vault's pages, contribute to a page's backlinks, enter the reference namespace, or be found by search. Assets are listed and referenced as assets (vault-assets capability), never as pages.

#### Scenario: A dropped markdown file under assets is not a page

- **GIVEN** a vault containing `assets/notes.md`
- **WHEN** the vault is scanned and indexed
- **THEN** no page is derived from `assets/notes.md`, and it never appears among the vault's pages or in backlinks

#### Scenario: An asset's references do not contribute to backlinks

- **GIVEN** a vault containing `assets/notes.md` whose content references `#Roadmap`
- **WHEN** the vault is scanned and indexed
- **THEN** `Roadmap`'s backlinks do not include `assets/notes.md`

### Requirement: The index exposes the vault's asset inventory
Reading a vault SHALL expose the paths of every non-hidden file under the vault's `assets/` folder, at any depth within it, whatever the file's extension. The inventory SHALL be derived from the folder on every scan, so a file added, removed, or renamed under `assets/` is reflected on the next refresh without any page being edited. Changing the inventory SHALL NOT change the vault's page set: no page is created, moved, or removed by an asset write. The inventory is derived data and SHALL NOT persist (ADR-0001, ADR-0004).

#### Scenario: Every file under assets is inventoried

- **GIVEN** a vault containing `assets/shot.png`, `assets/2026/q3-report.pdf`, and `assets/notes.md`
- **WHEN** the vault is scanned and indexed
- **THEN** the inventory contains `assets/shot.png`, `assets/2026/q3-report.pdf`, and `assets/notes.md`

#### Scenario: Hidden paths are not inventoried

- **GIVEN** a vault containing `assets/.thumbs/x.png` and `assets/.DS_Store`
- **WHEN** the vault is scanned and indexed
- **THEN** neither path is in the inventory

#### Scenario: Asset writes do not disturb the page index

- **GIVEN** an open vault whose index is up to date
- **WHEN** a binary asset is added to or changed under `assets/`
- **THEN** the page set is unchanged and no page is created, moved, or removed by the asset write

#### Scenario: A removed asset leaves the inventory

- **GIVEN** an index whose inventory contains `assets/shot.png`
- **WHEN** the file is deleted from the folder and the index refreshes
- **THEN** the inventory no longer contains `assets/shot.png`

### Requirement: The index derives each page's asset references
For every page, the index SHALL report the vault paths that the page's Markdown links and images target, in order of appearance and deduplicated. A target SHALL be reported only when it is vault-relative — no URL scheme, no leading `/`, no fragment — is not a page, and names a file the vault holds. A percent-encoded destination SHALL be decoded before it is matched against the vault, and a destination that cannot be decoded SHALL be matched as the literal path it spells. A page's asset references SHALL be re-derived when the page's content changes, and their existence SHALL be re-checked whenever the vault's listing changes, so a file deleted from the folder stops being reported without the page being edited. Asset references are derived data and SHALL NOT persist (ADR-0001, ADR-0004).

#### Scenario: Link and image destinations are both reported

- **GIVEN** a page whose content is `[Q3 report](assets/q3-report.pdf) and ![shot](assets/shot.png)`
- **WHEN** the page is indexed
- **THEN** its asset references are `assets/q3-report.pdf` and `assets/shot.png`, in that order

#### Scenario: Repeated destinations collapse

- **GIVEN** a page that links `assets/shot.png` twice
- **WHEN** the page is indexed
- **THEN** its asset references contain `assets/shot.png` once

#### Scenario: External and fragment destinations are not asset references

- **GIVEN** a page whose content is `[site](https://example.com/x.pdf) and [here](#section)`
- **WHEN** the page is indexed
- **THEN** it has no asset references

#### Scenario: A percent-encoded destination resolves

- **GIVEN** the vault contains `assets/my report.pdf` and a page whose content is `[report](assets/my%20report.pdf)`
- **WHEN** the page is indexed
- **THEN** its asset references include `assets/my report.pdf`

#### Scenario: A destination that cannot be decoded still resolves

- **GIVEN** the vault contains `assets/100% done.pdf` and a page whose content is `[done](assets/100% done.pdf)`
- **WHEN** the page is indexed
- **THEN** its asset references include `assets/100% done.pdf`

#### Scenario: A link to a page file is not an asset reference

- **GIVEN** the vault contains `pages/other.md` and a page whose content is `[see](pages/other.md)`
- **WHEN** the page is indexed
- **THEN** the page has no asset references

#### Scenario: A destination naming no file is not reported

- **GIVEN** a page whose content is `[gone](assets/gone.pdf)` and no such file in the vault
- **WHEN** the page is indexed
- **THEN** the page has no asset references

#### Scenario: A file deleted outside the app stops being referenced

- **GIVEN** a page referencing `assets/shot.png`, and an index that reports it
- **WHEN** `assets/shot.png` is deleted from the folder and the index refreshes
- **THEN** the page's asset references no longer include it, although the page's own file did not change

### Requirement: The index derives the vault's boards from the boards/ folder

Reading a vault SHALL expose the paths of every board — every `.excalidraw` file under the vault's `boards/` directory, at any depth within it, when no path segment begins with `.` — ordered by path. The listing SHALL come from the same folder listing the pages come from, so a board added or removed outside the app appears on the next scan without the app writing anything. A `.excalidraw` file outside `boards/` SHALL NOT be listed as a board, and a board SHALL NOT produce a page.

#### Scenario: A board file is listed

- **GIVEN** a vault containing `boards/migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the vault's boards include `boards/migration.excalidraw`

#### Scenario: Nested boards are listed

- **GIVEN** a vault containing `boards/2026/q3.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the vault's boards include `boards/2026/q3.excalidraw`

#### Scenario: A hidden board is not listed

- **GIVEN** a vault containing `boards/.draft.excalidraw`
- **WHEN** the vault is indexed
- **THEN** it is not listed as a board

#### Scenario: A board added outside the app appears

- **GIVEN** an open vault whose index is up to date
- **WHEN** `boards/sketch.excalidraw` is copied into the folder outside the app and the index refreshes
- **THEN** the vault's boards include it

### Requirement: The index extracts board references and resolves them to boards

The index SHALL extract from each page's content every board reference written in Folio's two board forms (`#!word` where `word` is letters, digits, `_`, `-`; and `#![[Many Words]]`), recording the referenced board name and the lexical form used, each name once per page. The name SHALL resolve, ignoring letter case, to the board whose path is `boards/<name>.excalidraw`; a name with no matching board SHALL remain a valid board reference. Non-board forms, including `#word` and `#[[Page]]`, SHALL NOT be extracted as board references. For every board a page references, the index SHALL provide the reverse set: the pages whose content references that board, excluding a board's own file (which is not a page and holds no Markdown).

#### Scenario: Both board forms are extracted

- **WHEN** a page contains `See #!Migration and #![[Migration topology]]`
- **THEN** the index records board references to `Migration` and to `Migration topology`, each with its lexical form

#### Scenario: Duplicate board references collapse

- **WHEN** a page contains `#!Migration` twice
- **THEN** the index records a single board reference to `Migration`

#### Scenario: Page references are not board references

- **WHEN** a page contains `#Migration` and `#[[Migration]]`
- **THEN** the index records no board reference for either

#### Scenario: A board resolves case-insensitively

- **GIVEN** a vault holding `boards/Migration.excalidraw`
- **WHEN** a page contains `#!migration`
- **THEN** the reference resolves to `boards/Migration.excalidraw`

#### Scenario: A board reference to a missing board is valid

- **WHEN** a page contains `#![[Architecture]]` and no such board exists
- **THEN** the index records the reference and no board file is created

#### Scenario: A board reports the pages that reference it

- **GIVEN** `Ideas.md` and `Log.md` each containing a reference to `Migration`, and a board `boards/Migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the board's referencing pages are `Ideas.md` and `Log.md`

#### Scenario: A page that removed its reference stops being a referrer

- **GIVEN** a page referencing `#!Migration`, and an index that reports it
- **WHEN** the page's content no longer contains the token and the index refreshes
- **THEN** the board's referencing pages no longer include that page
