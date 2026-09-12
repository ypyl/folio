## ADDED Requirements

### Requirement: Pasted files are copied into the vault and linked at the cursor
When the clipboard a paste carries from contains one or more files and no plain text, and a page is open, the app SHALL treat each file exactly as a dropped one: copy it into the vault's `assets/` folder under a unique name, and insert a markdown link for every file that was copied successfully at the caret position in the open page — `![name](assets/name.ext)` for image files, `[name](assets/name.ext)` for others. The insertion SHALL go through the normal edit path, so the reference appears in the page's autosaved draft and renders. Where the clipboard offers only a generic name for the file — a bitmap handed over as `image.png` or `blob`, or a name carrying no stem at all — the asset SHALL instead be named from the paste's local time, keeping an extension that matches the file's type, so repeated pastes produce identifiable names rather than `image-1`, `image-2`. A file whose clipboard name is meaningful SHALL keep it. A paste whose clipboard carries plain text SHALL leave the editor's own markdown-aware paste to handle it, whether or not files accompany it. A paste with no files SHALL change nothing, and a paste with no page open SHALL copy nothing.

#### Scenario: Pasting a screenshot attaches it and shows it
- **GIVEN** an open page with the caret in the editor and a clipboard holding a bitmap under a generic name
- **WHEN** the user pastes
- **THEN** the image is copied into the vault under `assets/` with a name carrying the paste's time, an image link to it is inserted at the caret, and the reference renders the pasted bytes

#### Scenario: A pasted file with a real name keeps it
- **GIVEN** an open page and a clipboard holding a file named `Q3 report.pdf`
- **WHEN** the user pastes
- **THEN** the vault gains `assets/Q3 report.pdf` - numbered like any other colliding asset name - and a plain link to it is inserted at the caret

#### Scenario: Pasted text still follows the text rules
- **GIVEN** a clipboard carrying plain text, and one carrying plain text alongside a file
- **WHEN** the user pastes either
- **THEN** the editor's markdown-aware paste handles it as before and no file is copied into the vault

#### Scenario: A paste with nothing to attach changes nothing
- **GIVEN** an empty clipboard, and a clipboard holding files with no page open
- **WHEN** the user pastes
- **THEN** no vault file is written and the editor's content is unchanged

#### Scenario: A failed copy leaves no link
- **GIVEN** an open page and a clipboard holding two files whose second copy fails
- **WHEN** the user pastes
- **THEN** only the first file lands in the vault and only its link is inserted
