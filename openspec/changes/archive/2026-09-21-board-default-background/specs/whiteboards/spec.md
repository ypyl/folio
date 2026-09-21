## ADDED Requirements

### Requirement: A board with no background of its own opens on the app's parchment

While a board is open, the board editor's canvas background SHALL be the scene's own `viewBackgroundColor` when the board carries one. A board whose scene names no background — a board created from a reference and never saved, or a file that carries no background value — SHALL open with the canvas background set to the app's parchment token (`--parchment`, `#f5f4ed`) rather than the editor's own white default, so a new board is not the one pure-white surface in the app. The default SHALL apply only when the scene names none: a board saved with a background, or one whose background the user changed with the editor's background picker, SHALL reopen with that value unchanged. The background SHALL be part of the board's scene, so it saves and reopens like any other board property, and the app SHALL NOT write a background over one the board already holds.

#### Scenario: A new board opens on parchment

- **GIVEN** a vault with no board file for `boards/Migration.excalidraw`
- **WHEN** the user opens a `#!Migration` reference
- **THEN** the board editor's canvas background is `#f5f4ed`, not the editor's white default

#### Scenario: A board that names no background gets the default

- **GIVEN** a board file whose scene carries no `viewBackgroundColor`
- **WHEN** the board is opened
- **THEN** the canvas background is `#f5f4ed`

#### Scenario: A board's own background is respected

- **GIVEN** a board file whose scene carries `viewBackgroundColor` `#fffce8`
- **WHEN** the board is opened
- **THEN** the canvas background is `#fffce8`, unchanged by the default

#### Scenario: The background saves with the scene

- **GIVEN** a new board opened on the parchment default
- **WHEN** the user draws an element and the save settles
- **THEN** the board's file holds the scene with `viewBackgroundColor` `#f5f4ed`
