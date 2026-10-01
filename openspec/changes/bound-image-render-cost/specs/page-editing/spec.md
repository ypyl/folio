# Spec Delta

## MODIFIED Requirements

### Requirement: Vault image references render in the editor
When an open page's markdown references an image whose path points into the vault — a root-relative path carrying no URL scheme — the editor SHALL display that file's bytes in place of the reference, reading them through the storage seam's binary read. The page's markdown SHALL NOT change: the document keeps the path it had, so the file stays canonical and reload-stable (ADR-0001). A reference the vault cannot resolve — no such file, or a path the storage rejects — SHALL be left as it renders now, and that path SHALL NOT be read again for the rest of the page's time open. A reference carrying a scheme (`http:`, `https:`, `data:`, `blob:`) SHALL be left untouched: the editor reads no vault file for it and rewrites nothing. A vault path SHALL be read when its image is needed for display rather than for every image the page references at once, and the bytes the open page holds for images SHALL NOT grow with the number of images its markdown references: an image whose bytes are no longer needed for display SHALL release them and be read again if it is needed again. The editor SHALL NOT read the vault as part of handling a keystroke.

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

#### Scenario: An image far outside the viewport is not read at page render
- **GIVEN** an open page referencing many vault images, only a few of which are near the visible region
- **WHEN** the page renders
- **THEN** the vault is read only for the images near the visible region, and the page holds no bytes for the images outside it

#### Scenario: An image scrolled back into view is resolved again
- **GIVEN** an open page where an image's bytes were released after it left the viewport
- **WHEN** the user scrolls that image back into view
- **THEN** the image displays the vault file's bytes again

#### Scenario: Each vault image is read once per page
- **GIVEN** an open page displaying a vault image
- **WHEN** the user edits the page
- **THEN** the vault file is not read again and the displayed bytes do not change

## ADDED Requirements

### Requirement: An image-heavy page stays responsive
When an open page references many images, the page SHALL remain responsive: opening it and typing in it SHALL NOT block for an amount of time that grows with the number of images referenced or the size of their files. The page SHALL limit the number of vault reads it has in flight at once, so a page whose markdown references many images does not issue one binary read per image simultaneously. An image that is displayed SHALL be decoded without blocking the editing surface, so the document stays editable while its images arrive.

#### Scenario: Opening a screenshot-heavy page is not one blocking burst
- **GIVEN** a vault holding many large image files and a page referencing all of them
- **WHEN** the page is opened
- **THEN** no more than a bounded number of vault reads are in flight at once, and the editing surface accepts input while the images resolve

#### Scenario: Typing in a screenshot-heavy page stays responsive
- **GIVEN** an open page referencing many large vault images, with its images still resolving
- **WHEN** the user types continuously
- **THEN** each keystroke is handled without waiting for a vault read or an image decode

#### Scenario: A displayed image decodes asynchronously
- **GIVEN** an open page whose vault image reference has resolved
- **WHEN** the image is displayed
- **THEN** the image element asks the browser to decode it asynchronously, so the editing surface is not blocked by decoding
