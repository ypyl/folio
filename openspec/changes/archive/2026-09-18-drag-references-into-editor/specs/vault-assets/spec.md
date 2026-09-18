## ADDED Requirements

### Requirement: An asset row can be dragged into the open page
A row in the sidebar's Assets section SHALL be draggable, carrying the vault path of the file it lists. Dragging a row and releasing it over the editor pane SHALL write a reference to that file at the drop point (see "A reference dragged from the sidebar is written at the drop point"). A drag SHALL NOT open the file and SHALL NOT change any app state by itself: only a drag that is released over the editor pane writes anything, and only the open page's own text changes.

A drag is not an activation: a press and release on a row that does not start a drag SHALL still open the file exactly as before (ADR-0021), and a drag that ends anywhere other than the editor pane SHALL leave the app as it was.

#### Scenario: Dragging a row does not open the file
- **GIVEN** an open page and a vault holding `assets/q3-report.pdf`
- **WHEN** its row is dragged out of the sidebar and released somewhere with no drop target
- **THEN** no window opens, no download starts, and the page's text is unchanged

#### Scenario: A click on a row still opens the file
- **GIVEN** an open page and a vault holding `assets/q3-report.pdf`
- **WHEN** the user presses and releases on its row without moving the pointer
- **THEN** the file opens as it did before this gesture existed, and no reference is written into the page

#### Scenario: The row carries the file's path, not its label
- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** its row is dragged into the open page
- **THEN** the written destination is the vault path `assets/2026/q3-report.pdf`, not the row's label `2026/q3-report.pdf`
