## ADDED Requirements

### Requirement: The status bar's leading column matches the folder rail
The status bar SHALL open with a leading cell holding the pin control, and that cell's width SHALL equal the folder rail's column width (`--rail-w`) and start at the bar's leading edge, so the pin's column is the rail's column continued downward at the same horizontal position. The bar's remaining content SHALL keep its existing order and spacing: the breadcrumb follows the leading cell, then the hairline separator, the status group, and the vault group. The pin control SHALL keep its existing glyph size, label, disabled rules, and states; only the cell it occupies becomes rail-wide.

#### Scenario: The pin's column lines up with the rail
- **GIVEN** the shell rendered at desktop width
- **WHEN** the status bar lays out
- **THEN** the pin's cell is one rail column wide and starts at the bar's leading edge, occupying the same x range as the rail's column above it

#### Scenario: The rest of the bar keeps its layout
- **WHEN** the status bar renders with a page open, with no page open, and while the index builds
- **THEN** the breadcrumb, the hairline separator, the status group, and the vault group keep their order and spacing, and the pin control keeps its star glyph, accessible name, `aria-pressed` value, and title in its enabled and disabled states
