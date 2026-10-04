# Files

## Purpose

Folio's file model: the vault files a page points at with ordinary Markdown
links, how they are listed and opened, and why they stay outside everything
page-shaped.

## Requirements

### Requirement: A vault file is not a page

A vault file that is not a page SHALL stay a file. It SHALL produce no page, no
search result of its own, no reference, no backlink, no favorite, and no editor
content, and the app SHALL NOT edit, rename, move, or delete it.

#### Scenario: A file never becomes a page

- **GIVEN** a vault containing a markdown file and a PDF stored as files
- **WHEN** the vault is opened
- **THEN** neither produces a page or appears among the vault's pages

#### Scenario: A file is not reachable through a reference

- **GIVEN** a vault containing a file and a page referencing a page of the same
  name
- **WHEN** the vault is opened
- **THEN** the reference names the page, not the file

#### Scenario: Invoking a file never writes

- **WHEN** a file is listed, opened, or referenced
- **THEN** the file's bytes and the page's Markdown are unchanged

### Requirement: The Files listing lists the vault's files

The sidebar's Files listing SHALL hold the vault's file rows, ordered by path,
each labelled by its path within the vault's files folder and marked with an `a`
badge before its label. File rows SHALL follow the listing's page rows and its
board rows. When the folder holds no files the listing SHALL show no file rows,
and the listing shows its own empty-state copy only when it holds no rows at
all. While the active folder is loading, the listing SHALL show the loading
placeholder. A nested path SHALL be labelled by its path, so two files with the
same name in different folders read differently, and a file no page references
SHALL be listed like any other.

#### Scenario: The listing lists the folder's files in path order

- **GIVEN** a vault containing three files
- **WHEN** the Files listing renders
- **THEN** it lists three file rows, each with an `a` badge, ordered by path

#### Scenario: Nested folders are labelled by their relative path

- **GIVEN** a vault containing a file in a subfolder
- **WHEN** the Files listing renders
- **THEN** the row is labelled by the file's path within the files folder

#### Scenario: A file no page references is listed

- **GIVEN** a vault containing a file no page references
- **WHEN** the Files listing renders
- **THEN** the file is listed like any other

#### Scenario: A file added externally appears

- **GIVEN** an open vault whose contents are up to date
- **WHEN** a file is copied into the vault outside the app and the vault
  refreshes
- **THEN** the file is listed

### Requirement: Activating a file row opens the file and changes nothing else

Activating a file row — in the Files listing or in a page's Links list — SHALL
open the file: a type the browser displays SHALL be shown in a new window, and
any other type SHALL be downloaded for the operating system's application. The
file's name SHALL be used as it is. The file SHALL NOT be written, the page's
Markdown SHALL NOT change, and no app state SHALL change: the open page stays
open, the active marking does not move, the history trail gains no entry, and
the search surface is unchanged. A file the vault can no longer read SHALL open
nothing and leave the app as it is.

#### Scenario: A displayable file opens in a window

- **GIVEN** a vault containing a PDF, with a page open
- **WHEN** the user activates its row
- **THEN** the file opens in a new window and the open page and panes are
  unchanged

#### Scenario: A non-displayable file downloads

- **GIVEN** a vault containing an archive file
- **WHEN** the user activates its row
- **THEN** the browser downloads the file

#### Scenario: Opening a file leaves the session alone

- **GIVEN** a page open with unsaved edits, and a vault holding a file
- **WHEN** the user activates the file's row
- **THEN** the same page stays open, its save state is unchanged, no history
  entry is added, and Back and Forward step where they did before

#### Scenario: A name carrying a percent sign opens the file it names

- **GIVEN** a vault containing a file whose name holds a percent sign
- **WHEN** the user activates its row
- **THEN** the file is read and opened, not a decoded approximation of the name

#### Scenario: An unreadable file opens nothing

- **GIVEN** a file row whose file was deleted outside the app
- **WHEN** the user activates the row
- **THEN** nothing opens and the app remains as it was

### Requirement: A page's files are listed in its Links list

When a page is open, the Links list SHALL include one row per file the page
references, after its page rows, labelled with the file's name, marked with an
`a` badge, and listed in the order the references appear, and never dimmed or
marked as the open page. Files SHALL be the only file rows besides boards; a
page's files SHALL NOT appear among the Links page rows, which list page
references only. Activating a file row SHALL open the file. While the active
folder is loading the list SHALL show the loading placeholder. Board references
share this list.

#### Scenario: A page's files appear in the Links list

- **GIVEN** an open page whose content links a file and references a page
- **WHEN** the user looks at the Links section
- **THEN** it lists the file, marked with an `a` badge, and the page row carries
  no `a` badge

#### Scenario: A page's files are not page rows

- **GIVEN** an open page whose content links a file and references a page
- **WHEN** the user looks at the Links page rows
- **THEN** they list only the page, and no file row appears among them

#### Scenario: A file row opens instead of navigating

- **GIVEN** an open page whose Links list includes a file row
- **WHEN** the user activates that row
- **THEN** the file opens and the editor keeps showing the same page with the
  same active marking

#### Scenario: A page with no files shows no file rows

- **GIVEN** an open page that references pages but no files
- **WHEN** the user opens the Links section
- **THEN** it lists its page rows and no file rows, with no empty-state copy

### Requirement: A file link's destination offers the vault's matching files

While the caret is inside a link's or image's destination, the app SHALL offer
the vault's files that match the text typed so far, and SHALL write the chosen
file's path as the destination when a candidate is accepted. Each candidate
SHALL be labelled by its path within the vault's files folder and matched
against the typed text. Accepting SHALL write an ordinary Markdown link, or an
ordinary Markdown image when the user is typing an image's destination, with the
label the user typed or the file's name when none was typed. Completion SHALL be
offered only when the typed destination is vault-relative, does not begin with
`#`, is not already closed, and matches at least one file; an empty destination,
a scheme, an absolute path, a fragment, and text matching no file SHALL offer
nothing, so a link the app cannot complete behaves as it did before. Accepting
SHALL change only the page's own text: it SHALL NOT open the file, navigate, or
create a page or a reference.

#### Scenario: A typed prefix offers the matching files

- **GIVEN** a vault holding a PDF and an image, with a page open
- **WHEN** the user types a link destination beginning with `q3`
- **THEN** the picker offers the PDF and no other file

#### Scenario: Accepting writes the file's path as an ordinary link

- **GIVEN** the picker is offering a file for the typed label "Q3 report"
- **WHEN** the user accepts that row
- **THEN** the page's text is an ordinary link to the file, and the file is not
  opened by the acceptance itself

#### Scenario: An empty label is filled with the file's name

- **GIVEN** a file is offered for an empty label
- **WHEN** the user accepts the row
- **THEN** the page's text labels the link with the file's name

#### Scenario: An image destination writes an image

- **GIVEN** an image is offered while the user is typing an image's destination
- **WHEN** the user accepts the row
- **THEN** the page's text is an ordinary Markdown image, and the image renders
  the file's bytes

#### Scenario: An image destination offers no file that cannot be an image

- **GIVEN** a vault holding an image and a PDF, with a page open
- **WHEN** the user types an image destination beginning with the PDF's name
- **THEN** nothing is offered, because a PDF cannot be an image

#### Scenario: A reference deleted earlier can be added back

- **GIVEN** a page whose text no longer links a file the vault still holds
- **WHEN** the user completes a link to that file and saves the page
- **THEN** the page's text links the file and the page's Links list includes it

#### Scenario: An ordinary link to another site is left alone

- **GIVEN** a vault holding a file and a page open
- **WHEN** the user types a link destination beginning with `https://`
- **THEN** no picker is shown and the text remains as typed

#### Scenario: A fragment destination offers no file

- **WHEN** the user types a destination beginning with `#`
- **THEN** no file is offered for it

#### Scenario: Completion changes nothing but the page's text

- **GIVEN** an open page with unsaved edits, and a vault holding a file
- **WHEN** the user completes a link to that file
- **THEN** no page is created for it, the file's bytes are unchanged, and the
  open page, its save state, and the history trail are as they were

### Requirement: A file row can be dragged into the open page

A file row in the Files listing SHALL be draggable, carrying the file's path.
Releasing it over the editor pane SHALL write a reference to that file at the
drop point. A drag SHALL NOT open the file or change any other state by itself:
only a drag released over the editor pane writes, and only the open page's own
text changes. A press and release that does not start a drag SHALL still open
the file, and a drag that ends anywhere else SHALL leave the app as it was.

#### Scenario: Dragging a row does not open the file

- **GIVEN** an open page and a vault holding a file
- **WHEN** its row is dragged out of the sidebar and released somewhere with no
  drop target
- **THEN** no window opens, no download starts, and the page's text is unchanged

#### Scenario: A click on a row still opens the file

- **WHEN** the user presses and releases on a file row without moving the pointer
- **THEN** the file opens and no reference is written into the page

#### Scenario: The row carries the file's path, not its label

- **GIVEN** a vault holding a file in a subfolder
- **WHEN** its row is dragged into the open page
- **THEN** the written destination is the file's path, not the row's label
