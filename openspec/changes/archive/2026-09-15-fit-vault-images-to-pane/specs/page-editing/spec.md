## ADDED Requirements

### Requirement: Vault images fit the pane and expand to their original size

When an open page displays an image whose reference the vault resolved, the editor SHALL display it fitted to the width of the pane's content: an image wider than that width SHALL be scaled down to it with its aspect ratio preserved, and an image narrower than it SHALL be displayed at its own width — never enlarged. The displayed image SHALL carry a control in its corner that toggles between the fitted size and the image's own size. While expanded, the image SHALL be displayed at its own width, SHALL overflow the pane where it is wider than the pane, and the pane SHALL scroll to it. The control SHALL be visible while the pointer is over the image or the control has keyboard focus, SHALL stay visible while the image is expanded, and SHALL carry an accessible name that names the action it performs — expanding while the image is fitted, collapsing while it is expanded. The control SHALL be present only for an image the vault resolved. The expanded state SHALL NOT reach the document or any stored state: the page's markdown SHALL keep the reference it had, the file on disk SHALL be unchanged, and the state SHALL be discarded when the page is left or reloaded (ADR-0001, ADR-0009). A reference carrying a scheme (`http:`, `https:`, `data:`, `blob:`) and a vault reference the vault cannot resolve SHALL render exactly as they render today — natural size, no control — and the vault SHALL NOT be read for them on account of this requirement.

#### Scenario: A wide vault image is scaled to the pane
- **GIVEN** an open page displaying a vault image whose own width is greater than the pane's content width
- **WHEN** the page renders
- **THEN** the image is displayed at the pane's content width with its aspect ratio preserved

#### Scenario: A narrow vault image is left at its own size
- **GIVEN** an open page displaying a vault image whose own width is less than the pane's content width
- **WHEN** the page renders
- **THEN** the image is displayed at its own width, not enlarged

#### Scenario: The control expands an image to its original size
- **GIVEN** an open page displaying a fitted vault image
- **WHEN** the user activates the image's control
- **THEN** the image is displayed at its own width, overflowing the pane where it is wider, and the control is still present and visible

#### Scenario: The control collapses an expanded image
- **GIVEN** an open page displaying a vault image expanded to its own width
- **WHEN** the user activates the image's control again
- **THEN** the image is displayed fitted to the pane again

#### Scenario: The control is revealed by the pointer and by focus
- **GIVEN** an open page displaying a fitted vault image
- **WHEN** the pointer moves over the image, or the control receives keyboard focus
- **THEN** the control is visible

#### Scenario: The control names the action it performs
- **GIVEN** an open page displaying a vault image
- **WHEN** the image is fitted
- **THEN** the control's accessible name names expanding it, and once expanded the same control's accessible name names collapsing it

#### Scenario: Expanding changes nothing in the page
- **GIVEN** an open page whose markdown reads `![photo](assets/photo.png)`
- **WHEN** the user expands the image and then edits the page
- **THEN** the page's markdown still reads `![photo](assets/photo.png)`, with no width or size in it, and the file on disk is unchanged

#### Scenario: A remote image gets neither the fit nor the control
- **GIVEN** a page whose markdown references an image by an `https:` URL
- **WHEN** the page renders
- **THEN** the image keeps that URL and its own size, no control is shown for it, and the vault is not read for it

#### Scenario: An unresolvable vault reference gets no control
- **GIVEN** a page referencing a vault image path that holds no file
- **WHEN** the page renders
- **THEN** the reference renders as it does today and no control is shown for it

#### Scenario: The expanded state does not outlive the page
- **GIVEN** an open page whose vault image is expanded
- **WHEN** the user opens another page and returns to the first
- **THEN** the image is displayed fitted to the pane
