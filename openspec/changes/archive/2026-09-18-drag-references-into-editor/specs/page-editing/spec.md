## MODIFIED Requirements

### Requirement: Dropped files are copied into the vault and linked at the drop point
When files are dropped onto the editor pane while a page is open, the app SHALL copy each dropped file into the vault's `assets/` folder under a unique name and insert a markdown link for every file that was copied successfully at the **drop point** in the open page: an image link showing the file for image files, a plain link otherwise, with the destination written in the readable form the escaping rule requires ("A written vault-file link has a destination Markdown reads"). The drop point SHALL be the position in the page's text nearest the point where the pointer released the file, not the caret's last position. Where the release point names no position the link can occupy, the link SHALL be inserted at the caret instead. The insertion SHALL happen through the normal edit path so the copy appears in the page's autosaved draft.

#### Scenario: Dropping one image inserts an image link
- **GIVEN** an open page with the caret at a position in the editor
- **WHEN** a single PNG file is dropped onto the editor pane
- **THEN** the file is copied into the vault under `assets/` with a unique name, and `![(name)](assets/(name).png)` is inserted at the drop point

#### Scenario: A dropped file lands where it was aimed, not where the caret was
- **GIVEN** an open page with a caret near the top of the document
- **WHEN** a file is dropped onto a paragraph further down and the caret does not move
- **THEN** the link is inserted at the paragraph the pointer was over, and the page's text above it is unchanged

#### Scenario: A file dropped below the last block is appended
- **GIVEN** an open page whose document ends above the pane's bottom edge
- **WHEN** a file is released below the last block
- **THEN** the link is inserted at the end of the page

#### Scenario: Dropping a non-image file inserts a plain link
- **GIVEN** no image-extension file
- **WHEN** a PDF file is dropped onto the editor pane
- **THEN** the file is copied into the vault and a plain markdown link `[(name)](assets/(name).pdf)` is inserted at the drop point

#### Scenario: A dropped file whose name needs escaping is written as a readable link
- **GIVEN** an open page with the caret in the editor
- **WHEN** a file named `Q3 report.pdf` is dropped onto the editor pane
- **THEN** the vault gains `assets/Q3 report.pdf` and the text inserted at the drop point is `[Q3 report](assets/Q3%20report.pdf)`, which renders as a link to that file

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

## ADDED Requirements

### Requirement: A reference dragged from the sidebar is written at the drop point
When a drag carrying a sidebar row's payload is released over the editor pane while a page is open, the app SHALL insert, at the drop point in the open page, the reference that payload names: a payload naming a vault file SHALL be written as the ordinary Markdown link or image the drop and paste gestures write for that path ("A written vault-file link has a destination Markdown reads"), and a payload naming a page SHALL be written as a reference token in one of Folio's two lexical forms ("Page references have exactly two lexical forms"). The written reference SHALL read back as a reference to the same file or page the payload named.

The insertion SHALL go through the normal edit path, so the reference appears in the page's autosaved draft and undoes like typing.

The gesture SHALL write nothing to the vault: no file is copied, created, renamed, moved, or deleted, and no vault file's bytes change. It SHALL NOT open or navigate to the file or page it names, SHALL NOT add an entry to the history trail, and SHALL NOT change any state other than the open page's own text. When no page is open, or the payload names nothing the app can write, the drop SHALL change nothing at all, including the page's text and the caret. Where the release point names no position the reference can occupy — outside the page's text, or inside a block that cannot hold it, such as a code block — the reference SHALL be inserted at the caret instead.

#### Scenario: Dragging an asset row writes a link to that file
- **GIVEN** a vault holding `assets/q3-report.pdf` and an open page, with the caret somewhere in the page
- **WHEN** the `q3-report.pdf` row is dragged from the sidebar's Assets section and released over a paragraph below the caret
- **THEN** the text `[q3-report](assets/q3-report.pdf)` is inserted at that paragraph, the page's References section lists the file after the next save, and the file's bytes and the vault's listing are unchanged

#### Scenario: Dragging an image row writes an image
- **GIVEN** a vault holding `assets/shot.png` and an open page
- **WHEN** the `shot.png` row is dragged into the page
- **THEN** `![shot](assets/shot.png)` is inserted at the drop point and renders the file's bytes

#### Scenario: Dragging a page row writes a reference to that page
- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** that row is dragged from the sidebar's Pages section into the page
- **THEN** the text `#[[reading list]]` is inserted at the drop point, and `reading` is written as `#reading`

#### Scenario: A dropped reference is an ordinary edit
- **GIVEN** an open page with unsaved edits and a vault holding an asset
- **WHEN** the asset's row is dropped into the page
- **THEN** the reference appears in the page's autosaved draft, and undoing restores the page's text to what it was before the drop

#### Scenario: A dropped reference opens nothing and navigates nowhere
- **GIVEN** an open page and a vault holding `assets/q3-report.pdf`
- **WHEN** the file's row is dragged into the page and released
- **THEN** no window opens, the same page stays open, no entry is added to the history trail, and Back and Forward step where they did before

#### Scenario: A drag with no page open changes nothing
- **GIVEN** the app showing the empty start screen, with a vault holding an asset
- **WHEN** the asset's row is dragged over the editor pane
- **THEN** no text is written anywhere, nothing is copied into the vault, and the app does not navigate

#### Scenario: A drag released inside a code block does not corrupt it
- **GIVEN** an open page holding a fenced code block with the caret in a paragraph, and a vault holding an asset
- **WHEN** the asset's row is dropped onto the code block
- **THEN** the code block's text is unchanged and the reference is inserted where the caret is, because a code block cannot hold a reference

#### Scenario: The caret does not move on a drag it cannot use
- **GIVEN** an open page with the caret placed in a paragraph
- **WHEN** a drag is released whose payload names nothing the app can write
- **THEN** the page's text and the caret's position are unchanged
