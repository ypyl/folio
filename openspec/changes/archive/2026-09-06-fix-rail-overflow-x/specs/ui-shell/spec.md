## ADDED Requirements

### Requirement: The folder rail scrolls vertically only
The folder rail SHALL never render a horizontal scrollbar: content wider than the rail's column is clipped at the rail's box edges, never scrollable sideways.

#### Scenario: The rail shows no horizontal scrollbar even with a fixed-width add control
- **GIVEN** an open vault with its folder rail rendered
- **WHEN** the rail's add control and folder entries are laid out
- **THEN** no horizontal scrollbar appears in the rail, and vertical scrolling of the entry list is unchanged