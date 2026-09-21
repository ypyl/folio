## ADDED Requirements

### Requirement: The board's crosshair cursor is drawn in the app's palette

While a board is open and the active tool is one that shows a crosshair over the canvas — every drawing tool: rectangle, diamond, ellipse, arrow, line, freedraw, text, and frame — the cursor over the canvas SHALL be the app's own crosshair, drawn in the brand ink-blue with a light halo so it reads against both light and dark drawings, rather than the operating system's crosshair cursor whose colour the app does not control. The crosshair SHALL be shown for exactly the tools that would show one, and for no others: the selection, hand, eraser, laser, image, and custom tools SHALL keep the cursor they had. The cursor is presentation only: it SHALL NOT change tool behaviour, drawing, or hit-testing.

#### Scenario: A drawing tool shows the app's crosshair

- **GIVEN** an open board
- **WHEN** the user selects the rectangle tool and moves the pointer over the canvas
- **THEN** the pointer shows the app's ink-blue crosshair, not the platform's cursor

#### Scenario: Every drawing tool shows it

- **WHEN** the user selects in turn the rectangle, diamond, ellipse, arrow, line, freedraw, text, and frame tools and moves over the canvas
- **THEN** each shows the app's crosshair

#### Scenario: Other tools keep their own cursor

- **WHEN** the user selects the selection, hand, eraser, or laser tool and moves over the canvas
- **THEN** each keeps the cursor it had, and no app crosshair is shown

#### Scenario: The cursor changes with the tool

- **GIVEN** the selection tool is active
- **WHEN** the user selects a drawing tool and then returns to the selection tool
- **THEN** the cursor becomes the app's crosshair and then reverts, without a reload
