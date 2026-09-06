## MODIFIED Requirements

### Requirement: Empty state is a transient brand screen
When no folder is active, the center pane SHALL show a brand screen: the FolioMark as a purely decorative element (`aria-hidden`) with a short tagline. This empty state SHALL be reachable at startup when no folder is stored, by activating the brand while folders are listed, and by closing the active folder. The screen SHALL contain no button that promises an action the app cannot perform; returning to a folder is done from the rail.

#### Scenario: Brand screen before a vault opens
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark and a tagline, and no open-folder button or other interactive control is present

#### Scenario: Brand screen shows while folders are listed
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand to return home
- **THEN** the center pane shows the brand screen and every listed folder remains on the rail

## ADDED Requirements

### Requirement: The brand returns to the empty state
The Folio brand (the mark and title in the header's top-left) SHALL act as a home control: activating it SHALL make no folder active and show the empty state, leaving every listed folder on the rail. It SHALL work whether or not a folder is currently active, SHALL NOT close or forget any folder, and SHALL be a no-op when the empty state is already showing.

#### Scenario: Activating the brand returns home
- **GIVEN** an active folder with an open page
- **WHEN** the user activates the brand
- **THEN** no folder is active, the empty state shows, and the open page is no longer shown

#### Scenario: Activating the brand forgets nothing
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand
- **THEN** every listed folder remains listed and none is closed

#### Scenario: Activating the brand from the empty state is a no-op
- **GIVEN** the empty state is showing with no active folder
- **WHEN** the user activates the brand
- **THEN** the empty state remains showing and no folder becomes active

### Requirement: A folder rail entry can be closed
Every folder rail entry SHALL carry a close control that removes that entry from the rail and forgets its folder. The close control SHALL be a distinct surface from the entry's switch action: activating it SHALL NOT activate the entry or switch folders. Closing a non-active entry SHALL leave the active folder, its open page, and the workspace unchanged. Closing the active entry SHALL return the app to the empty state with no active folder, while any other listed folders remain on the rail. Closing an entry SHALL leave all other entries listed. Closing a folder SHALL NOT delete or modify its files on disk.

#### Scenario: A close control closes an entry without switching
- **GIVEN** two granted folders listed on the rail with the first active
- **WHEN** the user activates the close control of the second entry
- **THEN** the second entry is no longer listed, the first folder stays active, and the open page is unchanged

#### Scenario: Closing the active entry returns to the empty state
- **GIVEN** the active folder entry at the top of the rail with two other folders listed below it
- **WHEN** the user closes the active entry
- **THEN** the entry is removed, no folder is active, the empty state shows, and the two other folders remain listed

#### Scenario: The close control never triggers a switch
- **WHEN** the user activates an entry's close control while that entry is not the active folder
- **THEN** the entry is removed and the active folder does not change

#### Scenario: Closing a folder leaves the other entries listed
- **GIVEN** three granted folders listed on the rail
- **WHEN** the user closes one of them
- **THEN** the closed folder's entry is gone and the other two entries remain listed

#### Scenario: Closing does not touch the folder on disk
- **GIVEN** a listed folder whose Markdown files exist on disk
- **WHEN** the user closes that folder
- **THEN** the app forgets only its reference and every file in the folder remains on disk unchanged