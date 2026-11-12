# Spec Delta

## MODIFIED Requirements

### Requirement: The recent-changes panel lists the build's changes

The panel SHALL list the newest user-facing changes the build carries, newest
first, grouped by the version that shipped them. Each group SHALL show the
version and the date its changes landed, and each change its text; a change SHALL
NOT repeat the date inside its group. Past what the panel shows at once, the list
SHALL scroll inside it, and the bar SHALL neither grow nor scroll. The panel
SHALL hold no control, link, or setting of its own.

#### Scenario: The list reads newest first with the date each change landed

- **GIVEN** the open panel
- **WHEN** the user reads it
- **THEN** each group shows the version that shipped its changes with the date
  they landed, every change sits under its own version, and no group appears
  above a newer one

#### Scenario: A version's changes stay together

- **GIVEN** a version that shipped more than one user-facing change
- **WHEN** the user opens the panel
- **THEN** all of those changes sit under that version's single heading, and the
  next version starts a new group

#### Scenario: A long list scrolls inside the panel

- **GIVEN** more recent changes than the panel shows at once
- **WHEN** the user opens the panel
- **THEN** the panel's body scrolls and the bar neither grows nor scrolls
