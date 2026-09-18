## ADDED Requirements

### Requirement: A page row can be dragged into the open page
A row in the sidebar's Pages section SHALL be draggable, carrying the page's name. Dragging a row and releasing it over the editor pane SHALL write a reference to that page at the drop point (see "A reference dragged from the sidebar is written at the drop point"), in exactly one of the two lexical forms this capability defines ("Reference completion produces one of the two canonical forms"): `#name` when the name is a single word, and `#[[name]]` otherwise. The written token SHALL read back as a reference to the page the row named.

A row whose page name cannot be written as a reference token that reads back to that exact name SHALL NOT be draggable, exactly as such a name is never offered as a completion candidate ("Names with no valid reference token are never offered").

A drag SHALL NOT navigate to the page, open it, pin it, or change any state by itself: only a drag released over the editor pane writes anything, and only the open page's own text changes. A press and release on a row that does not start a drag SHALL still open the page exactly as before.

#### Scenario: A single-word page is dragged as the word form
- **GIVEN** an open page and a vault holding a page named `reading`
- **WHEN** its row is dragged from the sidebar's Pages section into the page
- **THEN** the text `#reading` is inserted at the drop point

#### Scenario: A multi-word page is dragged as the bracketed form
- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** its row is dragged into the page
- **THEN** the text `#[[reading list]]` is inserted at the drop point

#### Scenario: A dragged page reference resolves to that page
- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** its row is dragged into the page and the page is saved
- **THEN** the page's text holds a reference to `reading list`, and that page's backlinks include the page it was dropped into

#### Scenario: A name no token can express is not draggable
- **GIVEN** a vault holding a page named `weird]name`
- **WHEN** the user drags its row from the sidebar's Pages section into the open page
- **THEN** nothing is written into the page, because no reference form expresses that name

#### Scenario: Dragging a page row does not open it
- **GIVEN** an open page and a vault holding a page named `reading`
- **WHEN** its row is dragged into the page and released
- **THEN** the `reading` page does not open, no entry is added to the history trail, and the open page is still the one that was open

#### Scenario: A click on a row still opens the page
- **GIVEN** an open page listing another page in the sidebar
- **WHEN** the user presses and releases on that row without moving the pointer
- **THEN** that page opens as it did before this gesture existed, and no reference is written
