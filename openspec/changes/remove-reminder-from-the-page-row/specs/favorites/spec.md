# Spec Delta

## MODIFIED Requirements

### Requirement: A page row opens a menu of row actions

A page row in the Files listing SHALL open a menu when the user invokes the
context-menu gesture on it — a pointer right-click, or the keyboard gesture for
a context menu while the row has focus. The menu SHALL hold the favorite item
labelled "Favorite" or "Unfavorite" to match the state, a `Remove reminder` item
when the row's page has a reminder rule, and a "Present" item, in that order. The
menu SHALL open for page rows only: a board row, an asset row, and a journal day
cell SHALL have no menu. The row SHALL carry no visible trigger for it.

#### Scenario: Right-clicking a page row opens the menu

- **WHEN** the user right-clicks a page row
- **THEN** the row's menu opens at the pointer

#### Scenario: The keyboard opens the menu on the focused row

- **WHEN** a page row has keyboard focus and the user invokes the context-menu
  gesture
- **THEN** the row's menu opens, positioned at the row

#### Scenario: Non-page rows have no menu

- **WHEN** the user invokes the context-menu gesture on a board row, an asset
  row, or a journal day
- **THEN** no menu opens

#### Scenario: The menu names both actions

- **WHEN** the menu opens for a page that is not a favorite
- **THEN** it holds a "Favorite" item and a "Present" item, in that order

#### Scenario: The menu names the reminder item for a page with a reminder

- **GIVEN** a page whose reminder rule exists and the reminders feature is on
- **WHEN** the user opens that page row's menu
- **THEN** it holds a "Remove reminder" item between the favorite item and
  "Present"

#### Scenario: Activating Favorite toggles the state

- **WHEN** the user activates the favorite item
- **THEN** the page's favorite state toggles and the menu closes

#### Scenario: Activating Present presents the page

- **WHEN** the user activates the Present item
- **THEN** that page opens as a presentation and the menu closes
