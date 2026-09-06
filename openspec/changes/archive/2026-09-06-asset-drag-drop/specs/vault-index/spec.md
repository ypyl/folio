## ADDED Requirements

### Requirement: The assets folder is referenced, not navigated
The index scan SHALL exclude the vault's `assets/` folder: no file under `assets/` — regardless of extension — becomes a page, contributes to backlinks, or appears in navigation. Assets are reachable only through the markdown links that reference them.

#### Scenario: A dropped markdown file under assets is not a page
- **GIVEN** a vault containing `assets/notes.md`
- **WHEN** the vault is scanned and indexed
- **THEN** no page is derived from `assets/notes.md`, and it never appears in the sidebar or backlinks

#### Scenario: Asset writes do not disturb the page index
- **GIVEN** an open vault whose index is up to date
- **WHEN** a binary asset is added to or changed under `assets/`
- **THEN** the index's page set is unchanged and no page is created, moved, or removed by the asset write