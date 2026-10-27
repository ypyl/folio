# demo Specification

## Purpose
A one-click virtual vault that teaches Folio by letting a newcomer use every
feature on seeded Markdown, without touching their disk.

## Requirements

### Requirement: The guided demo opens without a local folder

Activating the guided demo SHALL open a virtual vault and show its Welcome page.
The demo SHALL use no folder picker, request no permission, and read or write no
user file. It SHALL be available in every browser, including one that cannot
open local folders.

#### Scenario: The no-folder screen opens the demo

- **WHEN** no folder is active and the user activates the guided demo
- **THEN** a virtual vault named as a demo becomes the active vault and its
  Welcome page opens

#### Scenario: The demo requests nothing from the user

- **WHEN** the user opens the guided demo
- **THEN** no folder picker opens, no permission prompt appears, and no local
  file is read or written

#### Scenario: The demo works where local folders cannot open

- **GIVEN** a browser that cannot open local folders
- **WHEN** the user activates the guided demo
- **THEN** the demo opens and its pages, journal, board, and assets are usable

#### Scenario: The demo's Welcome page is its landing page

- **WHEN** the demo opens
- **THEN** the Welcome page is shown instead of the current day's journal

#### Scenario: The demo is listed and closed like a folder

- **WHEN** the demo is open
- **THEN** the rail lists one entry for it, marked active, and closing that
  entry returns to the no-folder state

#### Scenario: Returning home keeps the demo for the session

- **GIVEN** the demo is open
- **WHEN** the user returns home and activates the demo's rail entry again
- **THEN** the demo's session contents are still there

### Requirement: The demo holds a worked example of every content kind

The demo SHALL be seeded with pages, journal days including today, a board,
assets, pins, and reminder rules. The Welcome page SHALL be a table of contents
whose entries open guide pages for references, links and backlinks, Contents,
journal, reminders, boards, assets, search, editing and tasks, and presentation.

#### Scenario: The demo's Files listing covers every kind

- **WHEN** the demo opens and the sidebar renders
- **THEN** Files lists its pages, a board, and assets, and the Journal calendar
  marks the days that have a note

#### Scenario: The Welcome page is a table of contents

- **WHEN** the Welcome page opens
- **THEN** it lists one entry per guide page and each entry opens that page

#### Scenario: Each guide explains and demonstrates its feature

- **WHEN** the user opens any guide page
- **THEN** the page explains the feature and the demo's own content demonstrates
  it, including a reference badge, a Contents tree, a journal day, a reminder
  rule, a board reference, or a vault asset where that feature applies

#### Scenario: The demo's references resolve

- **WHEN** the demo is indexed
- **THEN** every reference resolves to a demo page, journal day, or board,
  except the reference the References page explicitly identifies as missing

#### Scenario: The demo's board and assets are real demo files

- **WHEN** the user opens the demo board or a demo asset
- **THEN** the board opens in the board view and the asset opens from the
  demo's own storage

#### Scenario: Today's reminders land in today's journal

- **GIVEN** the demo holds reminder rules that match today
- **WHEN** the user opens today's journal
- **THEN** the due reminders are written into that note as task items

### Requirement: Demo edits are real but session-only

The demo SHALL behave like a vault while it is open: edits auto-save, links and
search follow the saved content, pins and reminders can change, boards can be
edited, and dropped or pasted files are added. Every write SHALL stay in
memory. The demo SHALL write no file, filesystem handle, IndexedDB row, or
localStorage entry, and closing the demo or reloading the tab SHALL discard its
contents.

#### Scenario: Editing the demo updates the app

- **GIVEN** the demo is open
- **WHEN** the user edits a page and waits for the save
- **THEN** the page, its links, and its search entry reflect the edit for the
  rest of the session

#### Scenario: Pins, reminders, boards, and dropped files work

- **WHEN** the user pins a page, sets a reminder, edits the board, or drops a
  file into the demo
- **THEN** the change takes effect in the demo's own content for the session

#### Scenario: Closing and reopening restores the seed

- **GIVEN** the demo is open and has been edited
- **WHEN** the user closes the demo and opens the guided demo again
- **THEN** the demo shows its original seeded content and none of the edits

#### Scenario: Reloading discards the demo

- **GIVEN** the demo is open and has been edited
- **WHEN** the tab reloads
- **THEN** the demo is not restored and the no-folder state shows

#### Scenario: A real folder is untouched

- **GIVEN** a real folder is open beside the demo
- **WHEN** the user edits the demo
- **THEN** the real folder's files, index, pins, and reminders are unchanged

### Requirement: The demo identifies itself

The demo's rail entry and vault name SHALL identify it as a demo. Its Welcome
page SHALL state that the vault is virtual, that edits last for the session, and
that nothing is written to the user's disk.

#### Scenario: The demo carries its name

- **WHEN** the demo is open
- **THEN** its rail entry and the status bar name it as a demo vault

#### Scenario: The Welcome page explains the sandbox

- **WHEN** the Welcome page opens
- **THEN** it says the contents are a virtual vault and that closing or
  reloading discards the changes

### Requirement: The demo costs nothing until it is opened

The demo's seed SHALL be static content that is constructed only when the user
opens the demo. Opening, scanning, and typing in a real vault SHALL NOT create
the demo's storage or read its content.

#### Scenario: A real vault does not build the demo

- **GIVEN** the app starts and the user opens a real folder
- **WHEN** the folder's index builds and the user types
- **THEN** no demo storage or demo content is created
