## ADDED Requirements

### Requirement: The editor pane offers a Present control for the open page

While a page is open in the editor, the editor pane SHALL offer a control that opens the
page as a presentation. The control SHALL be present only while a page is open; it SHALL be
absent or disabled on the brand empty state, while the active folder's index is building, on
a search-results surface, and on an open board. The control SHALL carry an accessible name
stating its action, SHALL be reachable and operable by keyboard, and activating it SHALL NOT
change the page, its content, or its save state. The control's presence SHALL NOT change the
document's layout: the content column's width, the first block's start line, and the editor surface's geometry SHALL be exactly as they are without it.

#### Scenario: The control appears with an open page

- **GIVEN** a page open in the editor
- **THEN** the editor pane offers a Present control named for its action

#### Scenario: No page means no control

- **WHEN** no page is open — on the brand empty state, on a search-results surface, or on an open board
- **THEN** the editor pane offers no Present control

#### Scenario: The control does not disturb the document

- **GIVEN** a page open in the editor
- **WHEN** the Present control is present
- **THEN** the content column's width and the first block's start line are unchanged from a page shown without it

#### Scenario: Activating the control changes nothing on the page

- **GIVEN** a page open in the editor
- **WHEN** the user activates the Present control
- **THEN** the page's content, its file, and its save state are unchanged
