# Spec Delta

## MODIFIED Requirements

### Requirement: A page with no note opens blank and is created on first save

Opening a page that has no note — through a Links row, a sidebar action, or a
journal day — SHALL open a blank editable page. Merely opening it SHALL create
no file, except that opening a journal day that matches a reminder rule writes
that day's reminder line, which creates the day's file. Otherwise the file SHALL
be created only when the user's edits are saved for the first time, so the folder
holds no files for pages merely viewed. A blank page created on first save SHALL
read as a new page, not as an edit to an existing one.

#### Scenario: Viewing a missing page creates nothing

- **GIVEN** a vault with no note for a page and no reminder that matches it
- **WHEN** the user opens that page without typing
- **THEN** the vault holds no new file

#### Scenario: First save creates the file

- **GIVEN** a blank page open for a page with no note
- **WHEN** the user types content and the save completes
- **THEN** the file exists in the vault holding exactly what was saved

#### Scenario: The save indicator names a new page

- **GIVEN** a blank page open with no note
- **WHEN** it has unsaved content
- **THEN** the save indicator reads as a new page being created, not as a
  pending edit

#### Scenario: A day with a matching reminder is written on open

- **GIVEN** a vault with a reminder rule and no note for the day it matches
- **WHEN** the user opens that journal day
- **THEN** the day's file is created holding the reminder's reference line
