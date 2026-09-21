## ADDED Requirements

### Requirement: A page's board references are listed in the References section

While a page is open, the meta panel's References section SHALL list one row per board the page's Markdown references with a `#!` token, in the same list as the page's asset rows and ordered with them alphabetically by row label. A board row SHALL be labelled by the board's path inside `boards/` — the label the sidebar's Boards section uses — and SHALL NOT appear in Forwardlinks, which lists page references only. A board the vault does not hold yet SHALL be rendered dimmed and remain activatable; a board the vault holds SHALL NOT be dimmed. Activating a board row SHALL open the board in the main pane, as activating a Boards row does: a navigation recorded in the session trail, never a file copy, and the vault file SHALL NOT be written by the activation. A `.excalidraw` file reached from the References list SHALL open in the board editor whether the row came from a `#!` token or an ordinary path link, because the extension decides the view. When a page references a board and also links the same file by path, the section SHALL list one row for it, not two.

#### Scenario: A page's board appears in References

- **GIVEN** an open page whose content is `See #!Migration` and a vault holding `boards/Migration.excalidraw`
- **WHEN** the user looks at the References section
- **THEN** it lists a `Migration.excalidraw` row

#### Scenario: Board and asset rows share one alphabetical list

- **GIVEN** an open page whose content is `#!Migration and [report](assets/q3-report.pdf)`
- **WHEN** the user looks at the References section
- **THEN** it lists `Migration.excalidraw` and `q3-report.pdf` rows, ordered by label

#### Scenario: A board with no file is dimmed but opens

- **GIVEN** an open page whose content is `#!Architecture` and no `boards/Architecture.excalidraw` in the vault
- **WHEN** the user looks at the References section and activates the row
- **THEN** the row is rendered dimmed and opening it shows a blank board in the main pane

#### Scenario: Activating a board row navigates to the board

- **GIVEN** an open page whose References section lists `Migration.excalidraw`
- **WHEN** the user activates that row
- **THEN** the board opens in the main pane, the row is the active entry in the trail, and the board's file is unchanged by the activation

#### Scenario: A board is not a Forwardlink

- **GIVEN** an open page whose content is `#!Migration and #Roadmap`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** it lists only the `Roadmap` row

#### Scenario: A token and a path link to one board yield one row

- **GIVEN** an open page whose content is `#!Migration and [x](boards/Migration.excalidraw)`
- **WHEN** the user looks at the References section
- **THEN** it lists a single `Migration.excalidraw` row
