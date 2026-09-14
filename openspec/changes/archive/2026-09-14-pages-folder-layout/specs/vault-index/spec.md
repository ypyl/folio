## MODIFIED Requirements

### Requirement: The index derives pages from the vault folder
Walking a vault folder SHALL produce one page per Markdown file under the `pages/` subfolder or the `journals/` subfolder, at any depth within those directories. A path SHALL become a page only when it ends in `.md` (case-insensitive), no path segment begins with `.`, and the path is within `pages/` or `journals/`; all other files, hidden paths, and Markdown files outside those directories SHALL NOT produce pages. The index SHALL be rebuilt when a folder is opened and refreshed afterward (see external-change requirements).

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
