## ADDED Requirements

### Requirement: The status bar's leading column matches the folder rail
The status bar SHALL open with a leading cell holding the pin control, and that cell's width SHALL equal the folder rail's column width (`--rail-w`), so the pin's column is the rail's column continued downward. The bar's hairline separator SHALL sit on the right edge of that column, continuing the rail's right border, with the path group beginning past it. The pin control SHALL keep its existing size, label, and disabled rules; only the cell it occupies is rail-wide.

#### Scenario: The bar's hairline lines up with the rail's border
- **GIVEN** the shell rendered at desktop width
- **WHEN** the status bar lays out
- **THEN** the bar's leading cell is one rail column wide and the hairline separator starts where the rail's right border does, so the breadcrumb follows it under the sidebar's column

#### Scenario: The pin control is unchanged
- **WHEN** the status bar renders the pin control in its enabled or disabled state
- **THEN** the control keeps its star glyph, accessible name, `aria-pressed` value, and title, and the bar's path, status, and vault groups keep their order and spacing
