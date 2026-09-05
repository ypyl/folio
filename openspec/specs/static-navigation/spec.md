# static-navigation Specification

## Purpose

Let a user navigate Folio's screens before any real vault exists: the sidebar lists hand-authored sample pages and journal entries, and selecting one renders it in the editor pane. The data is mock scaffolding, but the navigation contract is the shape the real vault will later satisfy.

## Requirements

### Requirement: Sidebar lists mock pages and journal entries
The sidebar SHALL list the mock vault's pages in the Pages section and its journal entries in the Journal section as selectable rows. Both sections SHALL retain independent open/close behavior. The mock data SHALL be authored as portable Markdown.

#### Scenario: Pages section lists sample pages
- **WHEN** the app loads
- **THEN** the Pages section shows a row for each sample page in the mock vault

#### Scenario: Journal section lists sample journal entries
- **WHEN** the app loads
- **THEN** the Journal section shows a row for each mock journal entry

### Requirement: Selecting a row opens the page in the editor pane
Selecting a page or journal entry row SHALL replace the editor pane's content with that page's rendered content, and SHALL mark the selected row as the active row in the sidebar.

#### Scenario: Clicking a page row swaps the editor content
- **WHEN** the user clicks a page row in the sidebar
- **THEN** the editor pane shows that page's title and content, and the clicked row is marked active

#### Scenario: Clicking a journal entry opens it like a page
- **WHEN** the user clicks a journal entry row
- **THEN** the editor pane shows that entry's title and content

#### Scenario: Selecting a different row replaces the current one
- **WHEN** the user clicks a second row while one is already open
- **THEN** the editor pane shows the second row's content and only the second row is marked active

### Requirement: App loads to the empty state
On load, no page SHALL be open: the editor pane SHALL show the brand empty state and no sidebar row SHALL be marked active. Nothing SHALL be auto-selected.

#### Scenario: Empty state on first load
- **WHEN** the app loads with no prior selection
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

### Requirement: Open page renders title and content
When a page is open, the editor pane SHALL show the page's title as a heading and its body rendered from Markdown: ATX headings, paragraphs, and `[[Page]]` / `#tag` references shown as inert tag chips. Chips SHALL NOT navigate or respond to clicks.

#### Scenario: Page renders title and markdown body
- **WHEN** a page is open in the editor pane
- **THEN** the pane shows the page title as a heading and the body with headings, paragraphs, and tag chips

#### Scenario: Reference chips are inert
- **WHEN** the user clicks a `[[Page]]` or `#tag` chip in the rendered content
- **THEN** nothing happens: no navigation occurs and the open page is unchanged

### Requirement: Meta panel remains placeholder
The meta panel SHALL continue to show placeholder copy in the Backlinks and Forwardlinks sections while a page is open.

#### Scenario: Meta placeholders persist
- **WHEN** a page is open
- **THEN** the Backlinks and Forwardlinks sections still show their placeholder copy

### Requirement: Mock data is disposable and isolated
The mock vault SHALL live in a single disposable data module that components receive via props, never import directly, so the real index can replace it by removing one import without touching component logic.

#### Scenario: Components do not import the mock directly
- **WHEN** the mock module is inspected
- **THEN** only the app composition layer imports it; Sidebar and EditorPane receive page data through props