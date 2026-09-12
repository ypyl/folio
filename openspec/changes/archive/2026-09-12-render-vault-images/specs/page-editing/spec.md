## ADDED Requirements

### Requirement: Vault image references render in the editor
When an open page's markdown references an image whose path points into the vault — a root-relative path carrying no URL scheme — the editor SHALL display that file's bytes in place of the reference, reading them through the storage seam's binary read. The page's markdown SHALL NOT change: the document keeps the path it had, so the file stays canonical and reload-stable (ADR-0001). A reference the vault cannot resolve — no such file, or a path the storage rejects — SHALL be left as it renders now, and that path SHALL NOT be read again for the rest of the page's time open. A reference carrying a scheme (`http:`, `https:`, `data:`, `blob:`) SHALL be left untouched: the editor reads no vault file for it and rewrites nothing. Each vault path SHALL be read at most once per open page, when the page's images are first rendered or when a reference is added, and never as part of handling a keystroke.

#### Scenario: A vault image reference shows the file's bytes
- **GIVEN** an open page whose markdown reads `![photo](assets/photo.png)` and a vault holding that file
- **WHEN** the page renders
- **THEN** the reference displays the vault file's bytes, and the page's markdown still reads `![photo](assets/photo.png)`

#### Scenario: A remote image reference is left alone
- **GIVEN** a page whose markdown references an image by an `https:` URL
- **WHEN** the page renders
- **THEN** the image element keeps that URL and the vault is not read for it

#### Scenario: An unresolvable reference is not read again
- **GIVEN** a page referencing a vault image path that holds no file
- **WHEN** the page renders and is then edited
- **THEN** the reference stays unresolved and the vault is not read for that path again

#### Scenario: Each vault image is read once per page
- **GIVEN** an open page displaying a vault image
- **WHEN** the user edits the page
- **THEN** the vault file is not read again and the displayed bytes do not change
