# Spec Delta

## ADDED Requirements

### Requirement: A diagram that is not drawn yet shows a placeholder

While a fence's drawing is pending, the surface SHALL show a loading placeholder
in the block's place, sized so the content below it does not jump when the drawing
lands. The placeholder SHALL be the app's own loading shape, SHALL be decorative,
and SHALL NOT be a control. The block SHALL be marked busy for assistive
technology, labelled as a diagram being drawn. The placeholder SHALL be replaced
by the drawing when it lands, and by the block's source with its note when the
engine refuses it.

#### Scenario: A pending drawing shows a placeholder

- **GIVEN** a page holding a mermaid fence whose drawing has not landed
- **WHEN** the page is shown
- **THEN** the block's place holds a loading placeholder, and the block reports
  itself busy to assistive technology

#### Scenario: The drawing replaces the placeholder

- **GIVEN** a pending diagram showing its placeholder
- **WHEN** the engine answers
- **THEN** the drawing replaces the placeholder and the block is no longer busy

#### Scenario: A refusal replaces the placeholder too

- **GIVEN** a pending diagram showing its placeholder
- **WHEN** the engine refuses the source
- **THEN** the block shows the source and its note, and reports itself no longer
  busy

#### Scenario: The placeholder is not a control

- **GIVEN** a pending diagram showing its placeholder
- **WHEN** the user presses it
- **THEN** the press behaves as a press on the drawing would: the caret lands in
  the fence and its source shows
