# Spec Delta

## ADDED Requirements

### Requirement: The completion popup reads as app chrome

The reference-completion popup SHALL be presented as the app's own floating
surface, not the editor library's default tooltip: an `--ivory` fill, no border,
8px radius, and the whisper shadow DESIGN.md reserves for surfaces that float.
Its rows SHALL follow the app's menu-row recipe — the app's UI type,
`--near-black` ink, and the app's row padding and radius — and the active row,
whether moved to by keyboard or hovered by pointer, SHALL carry the app's
interactive fill. The popup SHALL NOT introduce a second chromatic color; the
active row SHALL use the app's warm interactive surface rather than an ink-blue
fill, so the accent stays restrained. The popup's list SHALL keep the platform's
own scrollbar, because it is an overlay whose width comes from its content and
so opts out of the reserved scrollbar lane. Presentation SHALL NOT change which
rows appear, their order or cap, or the keyboard contract.

#### Scenario: The popup carries the app's surface

- **WHEN** the completion popup opens over the editor
- **THEN** it is drawn on an ivory surface with the app's radius and whisper
  shadow, not the editor library's stock tooltip theme

#### Scenario: The active row is the app's interactive fill

- **WHEN** a row is active, by keyboard or pointer
- **THEN** it carries the same warm interactive fill the app's menus and
  dropdown rows use, with no second chromatic color

#### Scenario: A row shows only the candidate's name

- **WHEN** the popup lists matching pages
- **THEN** each row shows the page's name as it exists, with no icon, date, or
  badge added

#### Scenario: Presentation changes no behavior

- **WHEN** the popup opens and the user moves between rows and accepts one
- **THEN** the rows, their order, and the written reference token are exactly
  what they were before the styling
