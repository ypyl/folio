## MODIFIED Requirements

### Requirement: The shell shows an app-level status bar

The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, on an open board, and on the brand empty state. The bar SHALL lead with the Back, Forward, and Today controls in that order at its leading edge, followed by three groups: the open document's file path as a breadcrumb (left, immediately after the navigation controls) — a page's, a journal day's, or a board's — a status group holding the save-state text and the indexing label, and the active vault's name and file count (right side). The Back and Forward controls SHALL be the trail controls specified by page-history, each disabled when there is no entry in its direction. Activating Today SHALL open the current day's journal — `journals/YYYY-MM-DD.md` for the current local date — exactly as selecting a calendar day does: the file's content when it exists, otherwise a blank in-memory page that materializes on first save and creates nothing on open. Today SHALL be rendered in every app state and SHALL be disabled while no vault is usable (no folder open, or the active folder's index still building), matching Back and Forward's treatment when they have nowhere to step; activating a disabled Today SHALL do nothing. Beside the vault's file count, at the bar's trailing edge, the bar SHALL show the running application version as `v<version>`, where `<version>` is the `version` field of `package.json`; the version SHALL be non-interactive text, SHALL render in every app state, and SHALL NOT be a control or gate any behavior. A group SHALL be empty when its content has no source: no page and no board open leaves the path group empty; a page or board with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar's display-only content SHALL perform no action: the breadcrumb's directory segments, the status text, and the vault name open no picker, switch no folder, re-grant no permission, and navigate nowhere. The bar's only controls SHALL be the Back, Forward, and Today controls and the open page's name where that page has a row in the Files listing, which reveals that row as the status-bar reveal requirement specifies.

#### Scenario: The bar frames every app state

- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with the three groups empty and the Back, Forward, and Today controls at its leading edge (Back, Forward, and Today disabled)

#### Scenario: The bar hosts the navigation controls

- **WHEN** the shell renders in any app state
- **THEN** Back, Forward, and Today appear at the bar's leading edge in that order, ahead of the breadcrumb

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

- **WHEN** the user activates the breadcrumb's directory segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom

## ADDED Requirements

### Requirement: The status bar's page name reveals the open page in the Files listing

When the open item is a page that has a row in the sidebar's Files listing, the status bar's page-name crumb SHALL be a control. Activating it SHALL reveal that page's row: unfold the left navigation when it is folded, open the Files section when that section is collapsed, scroll the page's row into view within the Files section's own scroll body, and move keyboard focus to that row. The control SHALL carry an accessible name that names the page it reveals and the action it performs. It SHALL be reachable and activatable by keyboard, and it SHALL show visible keyboard focus like every other interactive element. Revealing SHALL change nothing else: it SHALL NOT navigate, SHALL NOT change the open page or the editor's content, SHALL NOT change the listing's order or the open/closed state of any section other than the Files section, and SHALL write nothing to the vault. When the open item is a board, a journal day, or nothing at all, the file-name crumb SHALL stay non-interactive text; the directory crumbs SHALL always stay non-interactive text.

#### Scenario: Activating the page name reveals its row

- **GIVEN** a vault whose Files listing is long enough that the open page's row is outside the visible part of the listing
- **WHEN** the user activates the status bar's page name
- **THEN** that page's row is scrolled into view within the Files section and keyboard focus is on the row

#### Scenario: Revealing unfolds a folded left navigation

- **GIVEN** the left navigation is folded and the open page has a row in the Files listing
- **WHEN** the user activates the status bar's page name
- **THEN** the left navigation unfolds and the page's row is visible in the Files section with keyboard focus on it

#### Scenario: Revealing opens a collapsed Files section

- **GIVEN** the Files section is collapsed and the open page has a row in the Files listing
- **WHEN** the user activates the status bar's page name
- **THEN** the Files section opens with the page's row in view and keyboard focus on the row

#### Scenario: Revealing changes nothing else

- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user activates the status bar's page name
- **THEN** the open page and the editor's content are unchanged, the search spotlight stays closed, and nothing is written to the vault

#### Scenario: A journal day's breadcrumb is not a control

- **GIVEN** a journal day is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** nothing happens, and the crumb carries no control semantics

#### Scenario: A board's breadcrumb is not a control

- **GIVEN** a board is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** nothing happens, and the crumb carries no control semantics

#### Scenario: The page name is reachable by keyboard

- **GIVEN** a page with a Files row is open
- **WHEN** the user reaches the status bar with the keyboard and focuses the page name
- **THEN** the page name shows visible keyboard focus and reveals the row when activated
