## MODIFIED Requirements

### Requirement: Pages have a name, kind, and path

Every page SHALL have a title equal to its filename with the final `.md` removed, a kind of `journal` when its path starts with `journals/` and `page` otherwise, a vault-relative path that is its stable identity, and a last-modified time equal to the file's `lastModified` value at scan time. A page SHALL be identified by its path, not by its title.

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

#### Scenario: A page carries its last-modified time

- **WHEN** the index scans a vault whose file `Ideas.md` reports `lastModified` `T1`
- **THEN** the index's page for `Ideas.md` carries `T1` as its last-modified time

## ADDED Requirements

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