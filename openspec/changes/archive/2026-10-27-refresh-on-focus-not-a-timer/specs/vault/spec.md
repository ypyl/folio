# Spec Delta

## MODIFIED Requirements

### Requirement: The vault reflects changes made outside the app

Changes made to the folder outside the app SHALL appear without restarting:
added content appears, removed content disappears, and edited content updates,
including the references and files a page holds. The vault SHALL refresh when
the window regains focus, when the tab becomes visible again, and when the
folder is opened. It SHALL NOT poll the folder on a timer: an open tab that
neither regains focus nor becomes visible again does no scan. The app's own
saves SHALL be reflected at once, without waiting for a refresh. A save that
fails SHALL leave the vault's view as it was.

#### Scenario: A change made outside appears

- **WHEN** a note is added, edited, or removed in the folder and the app
  refreshes
- **THEN** the vault's pages and their references match the folder

#### Scenario: Coming back to the tab refreshes

- **GIVEN** an open vault whose note was edited outside the app
- **WHEN** the window regains focus or the tab becomes visible again
- **THEN** the vault shows the edited content

#### Scenario: An open tab does not scan on its own

- **GIVEN** an open vault in a tab that stays focused and visible
- **WHEN** time passes with no focus or visibility change
- **THEN** the app does not re-read the folder

#### Scenario: The app's own save is visible at once

- **WHEN** a page is saved successfully
- **THEN** the vault shows its new content and references immediately

#### Scenario: A failed save changes nothing

- **WHEN** a save fails
- **THEN** the vault still shows the page's previous content
