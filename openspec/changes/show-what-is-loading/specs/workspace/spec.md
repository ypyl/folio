# Spec Delta

## MODIFIED Requirements

### Requirement: Panes show loading placeholders while the active folder loads

While the active folder is loading — when it is first opened, when the user
switches to another folder, when a stored folder's permission is re-granted, and
while the app reopens its stored folder at start — the panes whose content comes
from the folder SHALL show loading placeholders instead of empty content: the
editor pane placeholder lines, the sidebar placeholder blocks in place of the
calendar and listing, and the right panel placeholder rows in place of its
placeholder copy. The loading state SHALL be announced to assistive technology as
an in-progress status naming the phase: reopening the stored folder, or indexing
the notes, whichever the app is doing. The placeholder blocks SHALL themselves be
decorative. The loading state SHALL end when the folder resolves, at which point
the panes show its real content: the today journal opens, the sidebar lists the
folder's content, and search enables. With no folder active, the shell SHALL show
the no-folder state, never loading placeholders.

The placeholders for reopening the stored folder SHALL be held for a moment
before they render, so a start that settles within that hold shows no placeholder
at all: a reader whose app is ready in a few milliseconds SHALL see content, not
a flash of loading shapes.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder is opened
- **THEN** the editor pane, sidebar, and right panel show loading placeholders
  until the folder resolves

#### Scenario: Reopening the stored folder shows loading placeholders

- **GIVEN** the app has a stored folder that takes a moment to reopen
- **WHEN** the app starts
- **THEN** the panes show loading placeholders, and the status names the reopening
  rather than the indexing of notes

#### Scenario: A fast start shows no placeholders

- **GIVEN** the app has a stored folder that reopens within the hold
- **WHEN** the app starts
- **THEN** no placeholder is shown, and the shell goes straight to the content

#### Scenario: Loading ends with real content

- **WHEN** the active folder resolves
- **THEN** the placeholders are gone, the editor opens the today journal, the
  sidebar lists the folder's content, and search is enabled

#### Scenario: No placeholders while no folder is active

- **WHEN** no folder is active
- **THEN** the shell shows the no-folder state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content

- **WHEN** the active folder is loading
- **THEN** the status announces the indexing status and the placeholders are not
  exposed as content
