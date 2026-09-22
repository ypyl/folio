## ADDED Requirements

### Requirement: The board editor's main menu offers the app's actions and no project links

While a board is open, the board editor's main menu SHALL list the editor's own editing and view actions — open, save, export, save as image, find on canvas, help, clear canvas, theme, and canvas background — and SHALL NOT list the editor library's own project links: no GitHub link, no X (Twitter) link, no Discord link, and no group heading naming them. Each remaining menu item SHALL keep the place and behavior it had. This requirement covers the main menu only; the editor's Help dialog, its browser notices, and its library panel are not the menu and SHALL be unchanged.

#### Scenario: The menu still offers the app's actions

- **GIVEN** an open board
- **WHEN** the user opens the editor's main menu
- **THEN** it lists open, save, export, save as image, find on canvas, help, clear canvas, theme, and canvas background, each still working as before

#### Scenario: The menu carries no project links

- **GIVEN** an open board
- **WHEN** the user opens the editor's main menu
- **THEN** it shows no GitHub, X (Twitter), or Discord link and no heading that groups them

#### Scenario: Other chrome is untouched

- **GIVEN** an open board
- **WHEN** the user opens the editor's Help dialog or the library panel
- **THEN** their own outbound links and content are unchanged
