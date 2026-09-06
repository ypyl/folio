# vault-index Specification

## Purpose

Builds and maintains Folio's in-memory graph of pages and page references from an opened vault folder, so the sidebar, editor, and (later) backlinks and search read from a live index over the user's Markdown files instead of mock data.

## Requirements

### Requirement: The index derives pages from the vault folder
Walking a vault folder SHALL produce one page per Markdown file reachable from the folder root, at any depth. A path SHALL become a page only when it ends in `.md` (case-insensitive) and no path segment begins with `.`; all other files and hidden paths SHALL NOT produce pages. The index SHALL be rebuilt when a folder is opened and refreshed afterward (see external-change requirements).

#### Scenario: A Markdown file becomes a page
- **WHEN** a vault contains `Welcome.md`
- **THEN** the index contains a page for `Welcome.md`

#### Scenario: Nested Markdown files are pages
- **WHEN** a vault contains `projects/ideas.md`
- **THEN** the index contains a page with the vault-relative path `projects/ideas.md`

#### Scenario: Non-Markdown files do not become pages
- **WHEN** a vault contains `image.png`, `notes.txt`, and `README`
- **THEN** none of them appear in the index as pages

#### Scenario: Upper-case extension is a page
- **WHEN** a vault contains `NOTES.MD`
- **THEN** it is indexed as a page

#### Scenario: Hidden paths do not become pages
- **WHEN** a vault contains `.obsidian/plugins/x.md` and `.hidden.md` at the root
- **THEN** neither path appears in the index as a page

### Requirement: Pages have a name, kind, and path
Every page SHALL have a title equal to its filename with the final `.md` removed, a kind of `journal` when its path starts with `journals/` and `page` otherwise, and a vault-relative path that is its stable identity. A page SHALL be identified by its path, not by its title.

#### Scenario: Title comes from the filename stem
- **WHEN** a vault contains `reading list.md`
- **THEN** the page title is `reading list`

#### Scenario: Multi-dot filename stem
- **WHEN** a vault contains `draft.v2.md`
- **THEN** the page title is `draft.v2` (only the final `.md` is removed)

#### Scenario: Journal entries are detected by directory
- **WHEN** a vault contains `journals/2026-09-02.md`
- **THEN** the page has kind `journal` and appears in the journal listing, while `notes.md` has kind `page` and appears in the pages listing

#### Scenario: A root file named like the directory is not a journal
- **WHEN** a vault contains `journals.md`
- **THEN** it is a page, not a journal

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
A reference SHALL resolve to a page whose filename stem matches the referenced text ignoring letter case; case does not change the resolution, only the on-disk stem is canonical for display. A reference to a page that does not exist in the vault SHALL remain a valid reference (the index records it, and no page is required to exist). When multiple pages differ only by case, the one whose path sorts first SHALL win resolution.

#### Scenario: Reference matches a page regardless of case
- **WHEN** the vault contains `Folio.md` and a page references `#folio` and another references `#FOLIO`
- **THEN** both references resolve to the page `Folio`

#### Scenario: Reference to a missing page is valid
- **WHEN** a page references `#[[feature roadmap]]` and no such file exists
- **THEN** the index still records the reference, and no page is created for it

#### Scenario: Case-only collision picks the first path
- **WHEN** the vault contains both `Project.md` and `project.md`, and a page references `#project`
- **THEN** the reference resolves to the page whose path sorts first of the two

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
Changes made to the vault folder outside the app SHALL appear in the index without restarting the app: the index SHALL refresh when the window gains focus, when it becomes visible, and periodically while it is visible. After a refresh, the index SHALL match the folder: added pages appear, removed pages disappear, and changed pages carry updated content and references.

#### Scenario: A file added externally appears
- **WHEN** a file `New.md` appears in the folder while the app is open, and the window later gains focus
- **THEN** `New.md` appears as a page in the index

#### Scenario: A file changed externally updates links
- **WHEN** `Ideas.md` gains a reference to `#Roadmap` while the app is open, and a refresh occurs
- **THEN** the index records `Roadmap` in `Ideas.md`'s outgoing references and `Ideas.md` in `Roadmap`'s backlinks

#### Scenario: A file removed externally disappears
- **WHEN** `Old.md` is deleted from the folder while the app is open, and a refresh occurs
- **THEN** `Old.md` no longer appears in the index or the sidebar

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
