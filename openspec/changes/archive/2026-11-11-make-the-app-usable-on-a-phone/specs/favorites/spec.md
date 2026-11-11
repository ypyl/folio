# Spec Delta

## MODIFIED Requirements

### Requirement: A page row opens a menu of row actions

A page row in the Files listing SHALL open a menu when the user invokes the
context-menu gesture on it — a pointer right-click, the keyboard gesture for a
context menu while the row has focus, or, on a touch-primary device, a press
held on the row. The hold SHALL be a press that the pointer keeps still for a
short interval; a press that moves (a scroll) or is released before that
interval SHALL NOT open the menu and SHALL keep the row's ordinary tap behavior,
and releasing the press after the menu opened SHALL NOT activate the row under
it. The menu SHALL hold the favorite item labelled "Favorite" or "Unfavorite" to
match the state, a `Remove reminder` item when the row's page has a reminder
rule, and a "Present" item, in that order. A menu item MAY carry a description
shown beneath its label as a smaller, muted line, which assistive technology
reads as the item's description rather than as part of its name. The menu SHALL
open for page rows only: a board row, an asset row, and a journal day cell SHALL
have no menu. The row SHALL carry no visible trigger for it.

#### Scenario: Right-clicking a page row opens the menu

- **WHEN** the user right-clicks a page row
- **THEN** the row's menu opens at the pointer

#### Scenario: The keyboard opens the menu on the focused row

- **WHEN** a page row has keyboard focus and the user invokes the context-menu
  gesture
- **THEN** the row's menu opens, positioned at the row

#### Scenario: A press and hold opens the menu on a touch device

- **GIVEN** a touch-primary device and the navigation view shown
- **WHEN** the user presses and holds a page row
- **THEN** the row's menu opens at the press, without the row's page opening

#### Scenario: Releasing the hold activates nothing

- **GIVEN** a touch-primary device and a page row's menu open from a hold
- **WHEN** the user lifts the pointer
- **THEN** the menu stays open and the row's page does not open

#### Scenario: A tap opens the page

- **GIVEN** a touch-primary device and the navigation view shown
- **WHEN** the user presses and releases a page row without holding
- **THEN** that page opens and no menu opens

#### Scenario: A hold that moves is a scroll

- **GIVEN** a touch-primary device and a listing longer than its view
- **WHEN** the user presses a row and drags it to scroll the listing
- **THEN** the listing scrolls and no menu opens

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
- **THEN** it holds a `Remove reminder` item between the favorite item and
  "Present", with that rule's schedule beneath the label

#### Scenario: Activating Favorite toggles the state

- **WHEN** the user activates the favorite item
- **THEN** the page's favorite state toggles and the menu closes

#### Scenario: Activating Present presents the page

- **WHEN** the user activates the Present item
- **THEN** that page opens as a presentation and the menu closes
