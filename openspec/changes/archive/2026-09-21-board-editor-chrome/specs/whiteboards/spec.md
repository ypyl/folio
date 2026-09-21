## ADDED Requirements

### Requirement: The board editor's chrome renders in the app's palette

While a board is open, the board editor's own chrome — its toolbar, islands, menus, dialogs, buttons, inputs, and popups — SHALL render in the app's design language rather than the editor library's stock light theme. The accent (selection, active tools, focus, links) SHALL be the app's ink-blue brand and no second chromatic colour SHALL appear in the chrome; island and panel surfaces SHALL be the app's warm ivory and parchment, never pure white; body and label text SHALL be the app's warm near-black and olive; borders SHALL be the app's warm hairline; floating surfaces SHALL carry the app's whisper shadow; and the interface font SHALL be the app's own, not the editor library's bundled font. The override SHALL be scoped to the board editor so no surface elsewhere in the app changes.

The editor's layout, toolbar arrangement, tool icons, canvas rendering, and the hand-drawn drawing fonts SHALL be unchanged: this is the palette around the canvas, not a re-skin of the editor's structure.

#### Scenario: The accent is the app's ink-blue

- **GIVEN** an open board
- **WHEN** the editor's active tool, selection, or a link renders
- **THEN** its accent colour is the brand ink-blue, not the library's violet-blue

#### Scenario: Islands are warm, never white

- **GIVEN** an open board
- **WHEN** the toolbar and any open menu or dialog render
- **THEN** their backgrounds are the app's ivory or parchment, not `#ffffff` and not a cool gray

#### Scenario: The interface font is the app's

- **GIVEN** an open board
- **WHEN** the editor's chrome text renders
- **THEN** it uses the app's interface font stack, not the library's bundled font

#### Scenario: The drawing surface is untouched

- **GIVEN** an open board with drawn elements
- **WHEN** the board renders
- **THEN** the hand-drawn drawing font, the toolbar's layout and tool icons, and the canvas rendering are the editor's own, changed only in the palette around them

#### Scenario: The override does not leak

- **GIVEN** the app with a board open
- **WHEN** the rest of the app's surfaces render
- **THEN** their colours and fonts are unchanged by the board editor's chrome override
