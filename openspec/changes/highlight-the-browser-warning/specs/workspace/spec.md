# Spec Delta

## ADDED Requirements

### Requirement: The unsupported-browser state is a visible warning

Where the browser cannot open local folders, the no-folder state SHALL show a
distinct warning rather than a tagline. The warning SHALL carry a heading that
names Chrome, Edge, and Brave, SHALL state that opening local folders needs a
Chromium-based browser, and SHALL remain visually distinct from the surrounding
brand copy. It SHALL still offer the guided demo. The warning SHALL NOT appear
where the browser can open local folders, and it SHALL write and store nothing.

#### Scenario: An unsupported browser shows the warning

- **GIVEN** a browser with no File System Access folder picker
- **WHEN** the app starts with no folder open
- **THEN** the center pane shows a warning with the heading "Chrome, Edge, or
  Brave required" and a body naming the Chromium-based browsers

#### Scenario: The warning stands apart from the tagline

- **GIVEN** the unsupported-browser warning is shown
- **WHEN** the user looks at the brand screen
- **THEN** the warning has its own surface and icon and does not read as the
  ordinary open-folder tagline

#### Scenario: The warning points at the demo

- **GIVEN** the unsupported-browser warning is shown
- **WHEN** the user looks below it
- **THEN** the guided demo is still offered, and activating it opens the demo

#### Scenario: A supported browser has no warning

- **GIVEN** a browser with the File System Access folder picker
- **WHEN** the app starts with no folder open
- **THEN** the brand screen shows its usual tagline and no browser warning

#### Scenario: The warning is presentational only

- **WHEN** the unsupported-browser warning renders
- **THEN** it creates no file, requests no permission, opens no picker, and
  writes nothing
