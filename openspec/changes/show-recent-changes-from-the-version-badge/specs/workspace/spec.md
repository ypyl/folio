# Spec Delta

## MODIFIED Requirements

### Requirement: The status bar spans the workspace

The shell SHALL render a thin status bar as a full-width row beneath the
workspace, present in every state — with a folder open, while it loads, on
search results, on an open board, and on the no-folder state. It SHALL show a
status group holding the save-state text and the loading label. At viewports
wider than the compact breakpoint it SHALL also show the open item's file path as
a breadcrumb and, at its trailing edge, the active folder's name and how many
notes it holds, with the running version beside them. At
or below the compact breakpoint it SHALL show the open item's name instead of the
path, and SHALL show neither the folder's name, nor its note count, nor the
version. A group SHALL be empty when it has no source, and the bar SHALL sit
outside the panes' scroll regions, so its content never scrolls. The bar's
display-only content SHALL perform no action; its controls SHALL be the running
version's disclosure, the open page's name where it has a Files row, and — at or
below the compact breakpoint — the navigation and meta view controls the compact
shell adds. The bar SHALL NOT
hold a Back, Forward, or Today control: those live on the Journal section's
summary row. At or below the compact breakpoint each view control SHALL show, by the
shape it draws rather than by colour alone, whether its view is the one shown:
the pane inside its frame SHALL be filled while that control's view is open and
empty while it is closed, and the open control SHALL additionally carry the
app's recede tint as its background.

#### Scenario: The bar is present in every state

- **GIVEN** the app on the no-folder state
- **WHEN** the shell renders
- **THEN** the status bar is present with its groups empty and no navigation
  control in it

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the bar shows the page's file path as a breadcrumb

#### Scenario: The loading label shows in the bar

- **WHEN** the active folder is loading
- **THEN** the bar shows the loading label

#### Scenario: The bar shows the running version

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders in any state
- **THEN** it shows the version beside the folder's name and its note count, as a
  control that discloses the build's recent changes

#### Scenario: The note count is the same before and after the index lands

- **GIVEN** a folder that holds notes, and an index that is still building
- **WHEN** the bar first renders and again once the index lands
- **THEN** the count beside the folder's name is the same number both times

#### Scenario: The note count leaves out what the folder holds besides notes

- **GIVEN** a folder holding notes, an image asset, a board, and its `.folio`
  state
- **WHEN** the bar renders its folder group
- **THEN** the count is the number of notes alone

#### Scenario: The compact bar drops the folder statistics

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the bar shows the page's name and shows neither the folder's name,
  nor its note count, nor the version, and it is not a scrolling row

#### Scenario: The bar carries no session navigation

- **WHEN** the shell renders in any state
- **THEN** the status bar holds no Back, Forward, or Today control, and those
  controls appear on the Journal section's summary row

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar remains fixed at the shell's bottom

#### Scenario: The bar performs no actions

- **WHEN** the user activates the breadcrumb's directory segments, the status
  text, or the folder name
- **THEN** nothing happens

#### Scenario: The compact bar carries the two view controls

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** the status bar carries a navigation view control at its leading edge
  and a meta view control at its trailing edge

#### Scenario: A view control draws its view's state

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** a view control's view is the one shown
- **THEN** that control draws its pane filled and carries the recede tint as its
  background, and the other control draws its pane empty with no background

#### Scenario: A view control exposes whether its view is shown

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** each view control reports whether its view is the one shown, and the
  state it draws agrees with what it reports

## ADDED Requirements

### Requirement: The version badge is a disclosure control

The status bar's version SHALL be a button that reports whether its panel is
open and opens, on activation, a panel anchored above the bar's trailing edge.
Where the badge is not rendered — at or below the compact breakpoint — the
disclosure SHALL NOT exist. The badge SHALL be reachable and activatable by
keyboard and SHALL show visible focus.

#### Scenario: Activating the badge opens the recent changes

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the user activates the version badge
- **THEN** a panel opens above the bar and the badge reports its panel open

#### Scenario: The compact bar offers no disclosure

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** no version badge and no recent-changes panel exist

### Requirement: The recent-changes panel lists the build's changes

The panel SHALL list the newest user-facing changes the build carries, newest
first, each showing the change's text and the date it landed. Past what the panel
shows at once, the list SHALL scroll inside it, and the bar SHALL neither grow
nor scroll. The panel SHALL hold no control, link, or setting of its own.

#### Scenario: The list reads newest first with the date each change landed

- **GIVEN** the open panel
- **WHEN** the user reads it
- **THEN** each entry shows the change's text and the date it landed, and no
  entry appears above a newer one

#### Scenario: A long list scrolls inside the panel

- **GIVEN** more recent changes than the panel shows at once
- **WHEN** the user opens the panel
- **THEN** the panel's body scrolls and the bar neither grows nor scrolls

### Requirement: Every ordinary dismissal closes the panel

A second activation of the badge, a pointer press anywhere outside the panel,
`Escape`, or the shell losing focus SHALL close the panel and return the badge's
reported state to closed. Closing SHALL NOT move keyboard focus, and opening or
closing SHALL NOT write to the vault or to any stored preference.

#### Scenario: The panel closes without moving focus

- **GIVEN** the open panel and keyboard focus on the badge
- **WHEN** the user presses `Escape`, or activates the badge again, or presses
  the pointer outside the panel
- **THEN** the panel closes, the badge reports it closed, and focus stays on the
  badge

#### Scenario: Reading the changes changes nothing else

- **GIVEN** an open page with unsaved edits
- **WHEN** the user opens and closes the panel
- **THEN** the edits, the open page, and the vault are as they were, and no
  preference is written
