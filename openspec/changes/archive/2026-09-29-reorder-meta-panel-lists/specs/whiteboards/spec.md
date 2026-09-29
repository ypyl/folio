## MODIFIED Requirements

### Requirement: While a board is open the meta panel shows the pages that reference it

While a board is open, the meta panel SHALL show a "Referenced by" section listing one row per page whose Markdown contains a board reference resolving to that board, ordered most recently edited first, with the path ascending as the tiebreak when two referencing pages share a last-edited time. Activating a row SHALL navigate to that page. When no page references the board, the section SHALL show empty-state copy, and while the index builds it SHALL show the shell's loading placeholders. The board's open/close state SHALL NOT otherwise change the panel's page-metadata sections.

#### Scenario: A board lists the pages that reference it

- **GIVEN** `boards/Migration.excalidraw`, referenced from `Ideas.md` and `Log.md`, and `Log.md` was edited more recently than `Ideas.md`
- **WHEN** the board is open
- **THEN** the panel's Referenced by section lists the `Log` row above the `Ideas` row, most recently edited first

#### Scenario: A row navigates to its page

- **WHEN** the user activates a row in Referenced by
- **THEN** that page opens in the main pane

#### Scenario: An unreferenced board shows copy

- **GIVEN** a board no page references
- **WHEN** the board is open
- **THEN** the Referenced by section shows empty-state copy

### Requirement: A page's board references are listed in the Forwardlinks Files group

While a page is open, the Forwardlinks section's Files group SHALL list one row per board the page's Markdown references with a `#!` token, in the same list as the page's asset rows, after them: the group lists the page's assets in their order of appearance in the page, then the page's boards in theirs. A board row SHALL be labelled by the board's path inside `boards/` — the label the sidebar's Boards section uses — and SHALL NOT appear in the Forwardlinks Pages group, which lists page references only. A board the vault does not hold yet SHALL be rendered dimmed and remain activatable; a board the vault holds SHALL NOT be dimmed. Activating a board row SHALL open the board in the main pane, as activating a Boards row does: a navigation recorded in the session trail, never a file copy, and the vault file SHALL NOT be written by the activation. A `.excalidraw` file reached from the Files group SHALL open in the board editor whether the row came from a `#!` token or an ordinary path link, because the extension decides the view. When a page references a board and also links the same file by path, the group SHALL list one row for it, not two.

#### Scenario: A page's board appears in References

- **GIVEN** an open page whose content is `See #!Migration` and a vault holding `boards/Migration.excalidraw`
- **WHEN** the user looks at the Forwardlinks Files group
- **THEN** it lists a `Migration.excalidraw` row

#### Scenario: Board and asset rows share one alphabetical list

- **GIVEN** an open page whose content is `#!Migration and [report](assets/q3-report.pdf)`
- **WHEN** the user looks at the Forwardlinks Files group
- **THEN** it lists the `q3-report.pdf` row above the `Migration.excalidraw` row, the page's assets before its boards

#### Scenario: A board with no file is dimmed but opens

- **GIVEN** an open page whose content is `#!Architecture` and no `boards/Architecture.excalidraw` in the vault
- **WHEN** the user looks at the Forwardlinks Files group and activates the row
- **THEN** the row is rendered dimmed and opening it shows a blank board in the main pane

#### Scenario: Activating a board row navigates to the board

- **GIVEN** an open page whose Forwardlinks Files group lists `Migration.excalidraw`
- **WHEN** the user activates that row
- **THEN** the board opens in the main pane, the row is the active entry in the trail, and the board's file is unchanged by the activation

#### Scenario: A board is not a Forwardlink

- **GIVEN** an open page whose content is `#!Migration and #Roadmap`
- **WHEN** the user looks at the Forwardlinks Pages group
- **THEN** it lists only the `Roadmap` row

#### Scenario: A token and a path link to one board yield one row

- **GIVEN** an open page whose content is `#!Migration and [x](boards/Migration.excalidraw)`
- **WHEN** the user looks at the Forwardlinks Files group
- **THEN** it lists a single `Migration.excalidraw` row
