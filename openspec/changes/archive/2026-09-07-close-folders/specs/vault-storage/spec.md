## ADDED Requirements

### Requirement: Closing a folder forgets it
Closing a folder SHALL remove it from both the open folder set and the persisted folder registry: on a later app start, a closed folder SHALL NOT be restored and SHALL NOT participate in last-active selection. Closing a folder SHALL NOT modify the folder's contents on disk. When the closed folder was active, the app SHALL return to the empty state and clear the persisted last-active pointer, so a later app start also opens the empty state; when the closed folder was not active, the last-active pointer SHALL be left unchanged. Re-adding a closed folder SHALL follow the normal picker flow and produce a fresh entry, since the duplicate-pick dedup compares only against listed folders.

#### Scenario: A closed folder is not restored on the next start
- **GIVEN** a stored folder that the user closes
- **WHEN** the app starts again
- **THEN** the closed folder is not listed and no permission is requested for it

#### Scenario: Closing the active folder clears the last-active pointer
- **GIVEN** an active stored folder with another stored folder also present, and the active one is closed
- **WHEN** the app starts again
- **THEN** no folder is active and the empty state opens

#### Scenario: Closing a non-active folder keeps the last-active pointer
- **GIVEN** an active stored folder and a second stored folder that is closed while not active
- **WHEN** the app starts again
- **THEN** the active folder remains the active one and is restored as such

#### Scenario: Re-picking a closed folder adds it as a fresh entry
- **GIVEN** a folder the user closed
- **WHEN** the user opens it again through the picker
- **THEN** a new entry is added for it (the dedup rule does not match it, since it is no longer listed)

#### Scenario: Closing never modifies the folder's files
- **GIVEN** a stored folder whose files exist on disk
- **WHEN** the user closes the folder
- **THEN** the app removes only its stored handle and every file in the folder remains unchanged