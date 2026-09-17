## REMOVED Requirements

### Requirement: The assets folder is referenced, not navigated
The index scan SHALL exclude the vault's `assets/` folder: no file under `assets/` — regardless of extension — becomes a page, contributes to backlinks, or appears in navigation. Assets are reachable only through the markdown links that reference them.

**Reason**: Its second claim is no longer true. Assets now appear in the sidebar's Assets section and in a page's Forwardlinks, and they are reached from the folder as well as from the links (ADR-0022). The still-true half — no asset becomes a page — is restated as its own requirement below.

**Migration**: The listing and behavior of assets are specified by the vault-assets capability, and the derived data it reads is specified by the requirements below. The page scan itself is unchanged: `assets/` still produces no pages and no backlinks.

## ADDED Requirements

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

## MODIFIED Requirements

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
