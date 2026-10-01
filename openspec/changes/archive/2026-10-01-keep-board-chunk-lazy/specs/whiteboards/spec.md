# Spec Delta

## ADDED Requirements

### Requirement: The board editor loads on demand

The board editor SHALL load only when a board is opened. The app's initial load SHALL NOT include the board editor's code or styles: starting the app SHALL NOT fetch the board editor's bundle, statically import it from the entry, or preload it. The board editor's bundle SHALL be fetched when a board is first opened in the session. The offline install SHALL NOT include the board editor's bundle, so installing the app does not download a board editor the vault may never use. This SHALL NOT change any other board behavior: opening, editing, and saving a board SHALL be unaffected.

#### Scenario: Starting the app fetches no board editor bytes

- **GIVEN** an app that has not opened a board
- **WHEN** the app starts
- **THEN** its startup does not fetch the board editor's bundle, statically import it from the entry, or preload it

#### Scenario: Opening a board fetches the board editor

- **GIVEN** the app running with no board open
- **WHEN** the user opens a board
- **THEN** the board editor's bundle is fetched and the board renders in the main pane

#### Scenario: The offline install excludes the board editor

- **GIVEN** the app installed for offline use
- **WHEN** the install completes
- **THEN** the board editor's bundle is not part of the installed payload
