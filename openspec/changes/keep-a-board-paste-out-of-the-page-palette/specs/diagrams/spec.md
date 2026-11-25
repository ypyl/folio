# Spec Delta

## MODIFIED Requirements

### Requirement: One engine configuration serves every renderer

The app and the board editor SHALL share one diagram engine, whose configuration
is global and mutable. A renderer SHALL set the configuration it draws with
immediately before it draws, and SHALL restore the configuration it found once
that drawing settles, whether it drew or was refused. Page and slide drawings
SHALL be serialized, so the engine is never asked for two of them at once. The
app's palette SHALL NOT outlive the drawing it was set for, so a diagram pasted
into a board SHALL NOT be drawn in the app's palette.

#### Scenario: A board render does not change the page's diagrams

- **GIVEN** a vault holding a board with pasted mermaid text and a page with a
  diagram
- **WHEN** the board is opened, its text is converted, and the page's diagram is
  then drawn
- **THEN** the page's diagram is drawn in the app's palette

#### Scenario: Two diagrams on one page do not interleave

- **GIVEN** a page holding two diagrams, both on screen and not yet drawn
- **WHEN** the pane draws them
- **THEN** they are drawn one after the other and each is complete

#### Scenario: A page's palette does not reach a board paste

- **GIVEN** a page that has drawn a diagram
- **WHEN** the user pastes mermaid text into a board and the board editor
  converts it
- **THEN** the converted elements do not use the app's palette

#### Scenario: A refused drawing leaves the engine as it was found

- **GIVEN** a fence the engine refuses, after a drawing in the app's palette
- **WHEN** the refusal settles and the next renderer draws
- **THEN** it finds the configuration that was in place before the app drew
