## ADDED Requirements

### Requirement: Dropped files are copied into the vault and linked at the cursor
When files are dropped onto the editor pane while a page is open, the app SHALL copy each dropped file into the vault's `assets/` folder under a unique name and insert a markdown link for every file that was copied successfully at the cursor position in the open page: `![name](assets/name.ext)` for image files, `[name](assets/name.ext)` for all other files. The insertion SHALL happen through the normal edit path so the copy appears in the page's autosaved draft.

#### Scenario: Dropping one image inserts an image link
- **GIVEN** an open page with the caret at a position in the editor
- **WHEN** a single PNG file is dropped onto the editor pane
- **THEN** the file is copied into the vault under `assets/` with a unique name, and `![(name)](assets/(name).png)` is inserted at the caret position

- **GIVEN** no image-extension file
- **WHEN** a PDF file is dropped onto the editor pane
- **THEN** the file is copied into the vault and a plain markdown link `[(name)](assets/(name).pdf)` is inserted at the caret position

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

### Requirement: Asset copies are never overwritten
The copy flow SHALL ensure each copied asset lands under a name that does not collide with an existing vault file, so an earlier asset is never silently replaced by a later drop.

#### Scenario: A colliding file name gets a numbered suffix
- **GIVEN** `assets/photo.png` already exists in the vault
- **WHEN** another `photo.png` is dropped onto the editor pane
- **THEN** the new file is saved as `assets/photo-1.png` and the inserted link points at `assets/photo-1.png`