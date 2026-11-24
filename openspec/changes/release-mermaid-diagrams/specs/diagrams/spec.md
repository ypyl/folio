# Spec Delta

## ADDED Requirements

### Requirement: A diagram renders in every build

The capability SHALL be on in every build. No build-time flag and no app-level
preference SHALL gate whether a `mermaid` fence renders, and every surface that
shows a page's Markdown — the editor pane and a presentation deck — SHALL draw a
fence's diagram without being handed a gate. Turning the app-level experimental
switch on or off SHALL NOT change what a page draws.

#### Scenario: The shipped build draws a diagram

- **GIVEN** a build with no environment override
- **WHEN** a page holding a `mermaid` fence is shown
- **THEN** the fence renders as its diagram, with no switch to flip

#### Scenario: The experimental switch does not change what a page draws

- **GIVEN** a page holding a `mermaid` fence and the app's experimental mode both
  off and on
- **WHEN** the page is shown in each state
- **THEN** the fence renders as its diagram in both

#### Scenario: A slide draws its diagram in every build

- **GIVEN** a page holding a `mermaid` fence and a presentation of that page
- **WHEN** the deck shows the fence's slide
- **THEN** the slide shows the drawing, with no switch to flip
