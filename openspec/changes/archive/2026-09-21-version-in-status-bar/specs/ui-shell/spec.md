## REMOVED Requirements

### Requirement: Meta panel shows the running version in its bottom-right corner

The right meta panel SHALL show the running application version as `v<version>`, where `<version>` is the `version` field of `package.json`, at the panel's bottom-right corner, below the keyboard-shortcuts reference. The version SHALL be non-interactive text, SHALL render in every app state, and SHALL NOT be a control or gate any behavior.

#### Scenario: The panel names the running version

- **WHEN** the shell renders, in any app state
- **THEN** the meta panel shows `v<version>`, where `<version>` matches the `version` field of `package.json`, and the badge is not an interactive control

#### Scenario: The badge sits in the panel's bottom-right corner

- **WHEN** the user looks at the meta panel
- **THEN** the version reads at the panel's bottom edge, right-aligned, below the keyboard-shortcuts reference

## MODIFIED Requirements

### Requirement: The shell shows an app-level status bar

The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, on an open board, and on the brand empty state. The bar SHALL hold the pin control in its leading column and three groups: the open document's file path as a breadcrumb (left, immediately after the leading column) — a page's, a journal day's, or a board's — a status group holding the save-state text and the indexing label (immediately after the breadcrumb), and the active vault's name and file count (right side). Beside the vault's file count, at the bar's trailing edge, the bar SHALL show the running application version as `v<version>`, where `<version>` is the `version` field of `package.json`; the version SHALL be non-interactive text, SHALL render in every app state, and SHALL NOT be a control or gate any behavior. A group SHALL be empty when its content has no source: no page and no board open leaves the path group empty; a page or board with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar SHALL hold no action other than the pin control: it opens no picker, switches no folder, re-grants no permission, and navigates nowhere.

#### Scenario: The bar frames every app state

- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with the three groups empty and no content beyond the pin control and the running version

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: An open board fills the path group

- **WHEN** the user opens a board
- **THEN** the status bar's path group shows the board's file-path breadcrumb and the status group reflects the board's save state

#### Scenario: The indexing label shows in the bar

- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar shows the running version beside the file count

- **WHEN** the shell renders, in any app state
- **THEN** the status bar shows `v<version>` at its trailing edge, beside the vault's name and file count, and the badge is not an interactive control

#### Scenario: The bar performs no actions

- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom
