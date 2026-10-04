# Spec Delta

## MODIFIED Requirements

### Requirement: The status bar spans the workspace

The shell SHALL render a thin status bar as a full-width row beneath the
workspace, present in every state — with a folder open, while it loads, on
search results, on an open board, and on the no-folder state. It SHALL lead with
Back, Forward, and Today in that order, then show a status group holding the
save-state text and the loading label. At viewports wider than the compact
breakpoint it SHALL also show the open item's file path as a breadcrumb and, at
its trailing edge, the active folder's name and file count with the running
version beside them as non-interactive text. At or below the compact breakpoint
it SHALL show the open item's name instead of the path, and SHALL show neither
the folder's name, nor its file count, nor the version. Back and Forward SHALL
be the trail controls, each disabled when there is nowhere to step. Activating
Today SHALL open the current day's journal exactly as choosing a calendar day
does, creating nothing on open, and SHALL be disabled while no folder is usable.
A group SHALL be empty when it has no source, and the bar SHALL sit outside the
panes' scroll regions, so its content never scrolls. The bar's display-only
content SHALL perform no action; its only controls SHALL be Back, Forward,
Today, the open page's name where it has a Files row, and — at or below the
compact breakpoint — the navigation and meta view controls the compact shell
adds. At or below the compact breakpoint each view control SHALL show, by the
shape it draws rather than by colour alone, whether its view is the one shown:
the pane inside its frame SHALL be filled while that control's view is open and
empty while it is closed, and the open control SHALL additionally carry the
app's recede tint as its background.

#### Scenario: The bar is present in every state

- **GIVEN** the app on the no-folder state
- **WHEN** the shell renders
- **THEN** the status bar is present with its groups empty and Back, Forward, and
  Today disabled at its leading edge

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the bar shows the page's file path as a breadcrumb

#### Scenario: The loading label shows in the bar

- **WHEN** the active folder is loading
- **THEN** the bar shows the loading label

#### Scenario: The bar shows the running version

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders in any state
- **THEN** it shows the version beside the folder's name and file count, as
  non-interactive text

#### Scenario: The compact bar drops the folder statistics

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the bar shows the page's name and shows neither the folder's name,
  nor its file count, nor the version, and it is not a scrolling row

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
  and a meta view control at its trailing edge, alongside its other controls

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
