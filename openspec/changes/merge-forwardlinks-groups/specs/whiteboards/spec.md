## RENAMED Requirements

- FROM: `### Requirement: A page's board references are listed in the Forwardlinks Files group`
- TO: `### Requirement: A page's board references are listed in the Forwardlinks list`

## MODIFIED Requirements

### Requirement: A page's board references are listed in the Forwardlinks list

While a page is open, the Forwardlinks list SHALL include one row per board the page's Markdown references with a `#!` token, after its page rows and its asset rows: it lists the page's page references first, then its assets in their order of appearance in the page, then its boards in theirs. A board row SHALL be marked with a `b` badge before its label and labelled by the board's path inside `boards/` — the label the sidebar's Files listing uses — and SHALL NOT appear among the Forwardlinks page rows, which list page references only. A board the vault does not hold yet SHALL be rendered dimmed and remain activatable; a board the vault holds SHALL NOT be dimmed. Activating a board row SHALL open the board in the main pane, as activating a board row in the sidebar does: a navigation recorded in the session trail, never a file copy, and the vault file SHALL NOT be written by the activation. A `.excalidraw` file reached from the Forwardlinks list SHALL open in the board editor whether the row came from a `#!` token or an ordinary path link, because the extension decides the view. When a page references a board and also links the same file by path, the list SHALL hold one row for it, not two.

#### Scenario: A page's board appears in References

- **GIVEN** an open page whose content is `See #!Migration` and a vault holding `boards/Migration.excalidraw`
- **WHEN** the user looks at the Forwardlinks list
- **THEN** it lists a `Migration.excalidraw` row marked with a `b` badge

#### Scenario: Board and asset rows share one alphabetical list

- **GIVEN** an open page whose content is `#!Migration and [report](assets/q3-report.pdf)`
- **WHEN** the user looks at the Forwardlinks list
- **THEN** it lists the `q3-report.pdf` row above the `Migration.excalidraw` row, the page's assets before its boards

#### Scenario: A board with no file is dimmed but opens

- **GIVEN** an open page whose content is `#!Architecture` and no `boards/Architecture.excalidraw` in the vault
- **WHEN** the user looks at the Forwardlinks list and activates the row
- **THEN** the row is rendered dimmed and opening it shows a blank board in the main pane

#### Scenario: Activating a board row navigates to the board

- **GIVEN** an open page whose Forwardlinks list includes the board row `Migration.excalidraw`
- **WHEN** the user activates that row
- **THEN** the board opens in the main pane, the row is the active entry in the trail, and the board's file is unchanged by the activation

#### Scenario: A board is not a Forwardlink

- **GIVEN** an open page whose content is `#!Migration and #Roadmap`
- **WHEN** the user looks at the Forwardlinks page rows
- **THEN** they list only the `Roadmap` row, unbadged

#### Scenario: A token and a path link to one board yield one row

- **GIVEN** an open page whose content is `#!Migration and [x](boards/Migration.excalidraw)`
- **WHEN** the user looks at the Forwardlinks list
- **THEN** it holds a single `Migration.excalidraw` row
