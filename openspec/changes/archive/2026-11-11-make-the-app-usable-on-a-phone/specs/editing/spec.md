# Spec Delta

## MODIFIED Requirements

### Requirement: Vault images fit the pane and expand to their original size

An image the vault resolved SHALL be displayed fitted to the pane's content
width: one wider than the pane SHALL be scaled down with its aspect ratio kept,
and one narrower SHALL be shown at its own width, never enlarged. Above the
compact breakpoint it SHALL carry a control in its corner that toggles between
the fitted size and the image's own size, visible while the pointer is over the
image or the control has focus and while the image is expanded, and named for the
action it performs. At or below the compact breakpoint it SHALL carry no control:
a phone has no pointer to hover with, and the fitted size is its only size. The
control SHALL be present only for an image the vault resolved. The expanded state
SHALL NOT reach the document or any stored state: the markdown SHALL keep the
reference it had, the file SHALL be unchanged, and the state SHALL be discarded
when the page is left or reloaded. A remote image and an unresolvable vault
reference SHALL keep its own size and get no control.

#### Scenario: A wide vault image is scaled to the pane

- **GIVEN** an open page displaying a vault image wider than the pane's content
- **WHEN** the page renders
- **THEN** the image is displayed at the pane's content width with its aspect
  ratio kept

#### Scenario: A narrow vault image is left at its own size

- **GIVEN** an open page displaying a vault image narrower than the pane
- **WHEN** the page renders
- **THEN** the image is displayed at its own width, not enlarged

#### Scenario: The control expands and collapses

- **GIVEN** an open page displaying a fitted vault image, above the compact
  breakpoint
- **WHEN** the user activates the control
- **THEN** the image is shown at its own width, overflowing the pane where it is
  wider; activating it again fits the image to the pane

#### Scenario: A compact image keeps its fitted size

- **GIVEN** an open page displaying a vault image, at or below the compact
  breakpoint
- **WHEN** the page renders
- **THEN** the image is fitted to the pane and carries no expand control

#### Scenario: Expanding changes nothing in the page

- **GIVEN** an open page displaying a vault image
- **WHEN** the user expands the image and then edits the page
- **THEN** the markdown still reads the same reference with no size in it and the
  file is unchanged

#### Scenario: The expanded state does not outlive the page

- **GIVEN** an open page whose vault image is expanded
- **WHEN** the user opens another page and returns
- **THEN** the image is fitted to the pane again
