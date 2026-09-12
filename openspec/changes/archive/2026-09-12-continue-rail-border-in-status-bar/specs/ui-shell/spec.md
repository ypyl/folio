## MODIFIED Requirements

### Requirement: The shell shows an app-level status bar
The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The bar SHALL hold the pin control in its leading column and three groups: the open page's file path as a breadcrumb (left, immediately after the leading column), a status group holding the save-state text and the indexing label (immediately after the breadcrumb), and the active vault's name and file count (right side). A group SHALL be empty when its content has no source: no page open leaves the path group empty; a page with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar SHALL hold no action other than the pin control: it opens no picker, switches no folder, re-grants no permission, and navigates nowhere.

#### Scenario: The bar frames every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with all three groups empty and no content beyond the pin control

#### Scenario: An open page fills the path group
- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: The indexing label shows in the bar
- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar performs no actions
- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll
- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom

### Requirement: The status bar's leading column matches the folder rail
The status bar SHALL open with a leading column holding the pin control, one folder-rail column wide and starting at the bar's leading edge, so the column is the rail's column continued downward at the same horizontal position. That column's right edge SHALL carry a vertical hairline in the bar's border colour, drawn at the same x as the rail's right border, so the rail's border reads as continuing into the status bar; this hairline SHALL be the bar's only vertical separator, so no second hairline sits between the breadcrumb and the status group. The pin control SHALL keep its existing size, glyph, label, disabled rules, and states, centred in the column. The bar's remaining content SHALL keep its existing order and spacing after the column: the breadcrumb, then the status group, then the vault group.

#### Scenario: The pin's column lines up with the rail
- **GIVEN** the shell rendered at desktop width
- **WHEN** the status bar lays out
- **THEN** the pin's column is one rail column wide and starts at the bar's leading edge, and its right edge carries the hairline at the same x as the rail's right border, so the two read as one vertical line

#### Scenario: The rest of the bar keeps its layout
- **WHEN** the status bar renders with a page open, with no page open, and while the index builds
- **THEN** the only vertical line in the bar is the leading column's right edge, the breadcrumb, the status group, and the vault group keep their order and spacing after it, and the pin control keeps its 24px star box, star glyph, accessible name, `aria-pressed` value, and title in its enabled and disabled states
