## ADDED Requirements

### Requirement: Collapsed link sections sit at the panel's bottom

The meta panel's link sections (Backlinks and Forwardlinks) SHALL occupy the space between the Contents section and the keyboard-shortcuts row as one group, and that group SHALL take the panel's remaining height. When a link section is collapsed, its summary row SHALL sit at the group's bottom edge, directly above the keyboard-shortcuts row, rather than directly beneath the section above it with the free space falling below it. When every link section is collapsed, their summary rows SHALL therefore sit together at the panel's bottom edge, above the keyboard-shortcuts row, with the free space left above them. While a link section is open it SHALL keep sharing the panel's remaining height, and a collapsed section SHALL appear after it without displacing it. This SHALL NOT change a section's open/closed state, the panel's fallback scrolling, or the rule that a collapsed section occupies exactly its summary row.

#### Scenario: Both link sections collapsed sit at the bottom

- **GIVEN** an open page with the Backlinks and Forwardlinks sections collapsed
- **WHEN** the user looks at the meta panel
- **THEN** the two summary rows sit at the panel's bottom edge, directly above the keyboard-shortcuts row, with the free space left above them beneath the Contents section

#### Scenario: A collapsed section sits at the bottom while another is open

- **GIVEN** an open page with Backlinks open and Forwardlinks collapsed
- **WHEN** the user looks at the meta panel
- **THEN** Backlinks keeps its share of the panel's height and the collapsed Forwardlinks summary sits directly above the keyboard-shortcuts row

#### Scenario: A short window still scrolls as before

- **GIVEN** a window too short for the open link sections' minimum heights
- **WHEN** the panel lays out
- **THEN** each open section keeps its minimum height, the panel itself scrolls, and no summary row is pushed out of reach
