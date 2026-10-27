# Spec Delta

## ADDED Requirements

### Requirement: The demo shows its session-only rule on every page

While the demo is open on a page, the editor pane SHALL show a notice that the
demo's changes last for the session and are never saved to the user's disk. The
notice SHALL stay visible while the page scrolls. It SHALL appear on every demo
page, including the Welcome page, and SHALL NOT appear for a real vault.

#### Scenario: The notice is visible on a demo page

- **GIVEN** the guided demo is open
- **WHEN** a page is shown
- **THEN** the editor pane shows a notice saying the changes are session-only
  and never saved to disk

#### Scenario: The notice stays while the page scrolls

- **GIVEN** a demo page taller than the editor pane
- **WHEN** the user scrolls the page
- **THEN** the notice remains at the top of the pane

#### Scenario: Every demo page carries the notice

- **WHEN** the user opens the Welcome page and any guide page
- **THEN** both show the notice

#### Scenario: A real vault has no notice

- **GIVEN** a real Markdown folder is open
- **WHEN** a page is shown
- **THEN** the editor pane shows no demo notice

#### Scenario: The board and results views are unchanged

- **GIVEN** the demo is open
- **WHEN** the user opens the board or the full search results
- **THEN** neither view gains the demo notice

#### Scenario: The notice is presentational only

- **WHEN** the notice renders
- **THEN** it carries no control, changes no page, writes nothing, and stores
  nothing
