# The vault

## Purpose

A vault is a folder of Markdown files the user owns. The folder is the
database: the app reads and writes it directly and keeps no copy of its own.
Everything the app shows comes from that folder and follows it when it changes.

## Requirements

### Requirement: A vault is the user's folder

Opening a vault SHALL show the content that folder holds. The folder SHALL
remain the only place the content lives: the app SHALL keep no application
database, and closing it SHALL lose nothing. The app SHALL read and write the
folder directly and SHALL never edit, move, rename, or delete the user's files
on its own.

#### Scenario: The folder is the source of truth

- **GIVEN** a vault opened in the app
- **WHEN** the user inspects what the app shows
- **THEN** every page, journal day, board, and file shown exists in the folder,
  and the app holds no copy of its own

#### Scenario: The app leaves the user's files alone

- **GIVEN** a vault open in the app
- **WHEN** the user browses it without editing
- **THEN** no file is created, renamed, moved, or deleted

### Requirement: A vault holds pages, journal days, boards, and files

A vault SHALL contain four kinds of content. A **page** is a Markdown note with
a name and content; its name identifies it. A **journal day** is the note for a
calendar date; a date is a journal day whether or not it has a note yet. A
**board** is a drawing stored in the vault. A **file** is any other vault file a
page can point at. A journal day, a board, and a file SHALL NOT become a page:
none produces page content, a backlink entry, a reference, a favorite, or a
search result of its own, and none is edited by the app.

#### Scenario: A markdown note is a page

- **WHEN** a vault holds a Markdown note
- **THEN** it appears as a page, with a name and content, and can be referenced

#### Scenario: A date is a journal day

- **WHEN** a vault has no note for a calendar date
- **THEN** that date is still a journal day that can be opened and referenced

#### Scenario: A board and a file are not pages

- **GIVEN** a vault holding a board and a file
- **WHEN** the vault is opened
- **THEN** neither produces a page or appears among the vault's pages

### Requirement: References resolve to pages and journal days

A reference SHALL resolve to a page whose name matches, ignoring letter case.
A reference whose name is a valid calendar date SHALL resolve to the journal day
for that date, whether or not it has a note. A reference to a page that does not
exist yet SHALL remain valid and SHALL create nothing. A page SHALL NOT be
counted as linking back to itself.

#### Scenario: A reference matches a page regardless of case

- **GIVEN** a vault holding a page named Folio and a note referencing `#folio`
- **THEN** the reference resolves to that page

#### Scenario: A date name resolves to the journal day

- **GIVEN** a note referencing `#[[2026-09-16]]`
- **THEN** it names the journal day for that date, whether or not a note exists

#### Scenario: A reference to a missing page is valid

- **WHEN** a note references a page that does not exist
- **THEN** the reference is still recorded and no page is created

### Requirement: A page knows what links to it and what it links to

For every page, the app SHALL know both the pages that reference it and the
pages it references, however each reference is written. A page's files and
boards SHALL be listed alongside its references.

#### Scenario: Backlinks include every referencing form

- **WHEN** one note references a page as `#Topic` and another as `#[[Topic]]`
- **THEN** that page's backlinks include both notes

#### Scenario: A page does not backlink itself

- **WHEN** a note references itself
- **THEN** its own backlinks do not include it

### Requirement: Folders persist across reloads

Every folder the user has opened SHALL be restored on the next start: each one
whose permission still holds SHALL reopen silently, and the one that was last
active SHALL become active. A folder whose permission is pending SHALL remain
listed and re-grant without being picked again; a folder whose permission is
denied SHALL be dropped. Opening a folder from the picker SHALL be additive, so
previously opened folders remain listed, and picking one that is already listed
SHALL activate the existing entry instead of adding a duplicate. Until a folder
is open, the app SHALL show its no-folder state.

#### Scenario: Granted folders reopen silently on start

- **WHEN** the app starts and folders have been opened before with permission
  still granted
- **THEN** each reopens without interaction and the last active one becomes
  active

#### Scenario: A folder with pending permission reconnects without re-picking

- **WHEN** the user activates a listed folder whose permission is pending
- **THEN** the app asks for permission, and once granted the folder becomes
  active without being picked again

#### Scenario: Adding a folder keeps the others

- **WHEN** the user opens a folder that was not previously listed
- **THEN** it becomes active and is listed alongside the previously opened
  folders

#### Scenario: A denied folder is dropped

- **WHEN** a folder's permission is denied
- **THEN** it is removed from the list, the remaining folders still reopen, and
  the picker remains the way to open a replacement

#### Scenario: Re-picking a listed folder activates it

- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate is added and the existing entry becomes active

### Requirement: A folder can be closed

Closing a folder SHALL remove it from the app's list of open folders so it is
not restored on a later start, and SHALL NOT change anything inside the folder.
When the closed folder was active, the app SHALL return to its no-folder state;
when it was not active, the active folder SHALL be unchanged.

#### Scenario: A closed folder is not restored

- **GIVEN** a folder the user closes
- **WHEN** the app starts again
- **THEN** the closed folder is not listed and no permission is asked for it

#### Scenario: Closing a non-active folder keeps the active one

- **GIVEN** an active folder and a second folder closed while not active
- **WHEN** the app starts again
- **THEN** the active folder is restored as active

#### Scenario: Closing never changes the folder's files

- **WHEN** the user closes a folder
- **THEN** every file in it is unchanged

### Requirement: The vault reflects changes made outside the app

Changes made to the folder outside the app SHALL appear without restarting:
added content appears, removed content disappears, and edited content updates,
including the references and files a page holds. The app's own saves SHALL be
reflected at once, without waiting for a refresh. A save that fails SHALL leave
the vault's view as it was.

#### Scenario: A change made outside appears

- **WHEN** a note is added, edited, or removed in the folder and the app
  refreshes
- **THEN** the vault's pages and their references match the folder

#### Scenario: The app's own save is visible at once

- **WHEN** a page is saved successfully
- **THEN** the vault shows its new content and references immediately

#### Scenario: A failed save changes nothing

- **WHEN** a save fails
- **THEN** the vault still shows the page's previous content
