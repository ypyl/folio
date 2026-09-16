## MODIFIED Requirements

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
