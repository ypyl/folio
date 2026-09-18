## ADDED Requirements

### Requirement: A written vault-file link has a destination Markdown reads
The app SHALL write the destination of every link or image it inserts for a vault file in a form a Markdown parser reads as that destination, so the reference is a link in the editor and in every other Markdown reader. The characters that would otherwise end or alter a destination — the space, the parentheses, the angle brackets, the quotation marks, the backtick, and the percent sign — SHALL be percent-encoded, and the path separator `/` SHALL NOT be. The written destination SHALL resolve back to the file's literal vault path: percent-decoding it SHALL produce exactly the path the file has in the vault, so the index's reference and the open gesture both name the same file.

#### Scenario: A name carrying a space is written as a readable link
- **GIVEN** a vault file named `Q3 report.pdf`
- **WHEN** a link to it is written
- **THEN** the destination is `assets/Q3%20report.pdf`, which the editor renders as a link and whose text round-trips to the same link after a reload

#### Scenario: A name carrying parentheses or a percent sign is written as a readable link
- **GIVEN** vault files named `a (draft).pdf` and `100% done.pdf`
- **WHEN** links to them are written
- **THEN** their destinations are `assets/a%20%28draft%29.pdf` and `assets/100%25%20done.pdf`, each decoding back to the file's literal name

#### Scenario: An ordinary path is written unchanged
- **GIVEN** a vault file named `assets/q3-report.pdf`
- **WHEN** a link to it is written
- **THEN** the destination is `assets/q3-report.pdf`, with no character escaped

#### Scenario: A written link is both a reference and a working link
- **GIVEN** a page holding the text the app writes for `assets/Q3 report.pdf`
- **WHEN** the page is saved and the vault re-indexed
- **THEN** the page's asset references include `assets/Q3 report.pdf`, and Ctrl+Click on the link opens that file

## MODIFIED Requirements

### Requirement: Dropped files are copied into the vault and linked at the cursor
When files are dropped onto the editor pane while a page is open, the app SHALL copy each dropped file into the vault's `assets/` folder under a unique name and insert a markdown link for every file that was copied successfully at the cursor position in the open page: an image link showing the file for image files, a plain link otherwise, with the destination written in the readable form the escaping rule requires ("A written vault-file link has a destination Markdown reads"). The insertion SHALL happen through the normal edit path so the copy appears in the page's autosaved draft.

#### Scenario: Dropping one image inserts an image link
- **GIVEN** an open page with the caret at a position in the editor
- **WHEN** a single PNG file is dropped onto the editor pane
- **THEN** the file is copied into the vault under `assets/` with a unique name, and `![(name)](assets/(name).png)` is inserted at the caret position

#### Scenario: Dropping a non-image file inserts a plain link
- **GIVEN** no image-extension file
- **WHEN** a PDF file is dropped onto the editor pane
- **THEN** the file is copied into the vault and a plain markdown link `[(name)](assets/(name).pdf)` is inserted at the caret position

#### Scenario: A dropped file whose name needs escaping is written as a readable link
- **GIVEN** an open page with the caret in the editor
- **WHEN** a file named `Q3 report.pdf` is dropped onto the editor pane
- **THEN** the vault gains `assets/Q3 report.pdf` and the text inserted at the caret is `[Q3 report](assets/Q3%20report.pdf)`, which renders as a link to that file

#### Scenario: Dropping several files inserts one link per copied file
- **GIVEN** an open page
- **WHEN** multiple files are dropped at once
- **THEN** each file is copied sequentially, one link is inserted per successfully copied file, and a file whose copy failed yields no link

#### Scenario: Drops never navigate the app away
- **GIVEN** the app window showing either the editor pane or the empty start screen
- **WHEN** a file is dropped anywhere on the pane
- **THEN** the browser's default drop behavior (navigating to the dropped file) is prevented, and when no page is open nothing is copied and no link is inserted

#### Scenario: Dropped directories are ignored
- **GIVEN** an open page
- **WHEN** a folder is dropped onto the editor pane
- **THEN** no files are copied from the folder, no links are inserted, and the app does not navigate

### Requirement: Pasted files are copied into the vault and linked at the cursor
When the clipboard a paste carries from contains one or more files and no plain text, and a page is open, the app SHALL treat each file exactly as a dropped one: copy it into the vault's `assets/` folder under a unique name, and insert a markdown link for every file that was copied successfully at the caret position in the open page — an image link showing the file for image files, a plain link otherwise, with the destination written in the readable form the escaping rule requires ("A written vault-file link has a destination Markdown reads"). The insertion SHALL go through the normal edit path, so the reference appears in the page's autosaved draft and renders. Where the clipboard offers only a generic name for the file — a bitmap handed over as `image.png` or `blob`, or a name carrying no stem at all — the asset SHALL instead be named from the paste's local time, keeping an extension that matches the file's type, so repeated pastes produce identifiable names rather than `image-1`, `image-2`. A file whose clipboard name is meaningful SHALL keep it. A paste whose clipboard carries plain text SHALL leave the editor's own markdown-aware paste to handle it, whether or not files accompany it. A paste with no files SHALL change nothing, and a paste with no page open SHALL copy nothing.

#### Scenario: Pasting a screenshot attaches it and shows it
- **GIVEN** an open page with the caret in the editor and a clipboard holding a bitmap under a generic name
- **WHEN** the user pastes
- **THEN** the image is copied into the vault under `assets/` with a name carrying the paste's time, an image link to it is inserted at the caret, and the reference renders the pasted bytes

#### Scenario: A pasted file with a real name keeps it
- **GIVEN** an open page and a clipboard holding a file named `Q3 report.pdf`
- **WHEN** the user pastes
- **THEN** the vault gains `assets/Q3 report.pdf` - numbered like any other colliding asset name - and the text `[Q3 report](assets/Q3%20report.pdf)` is inserted at the caret, which renders as a link to that file

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
