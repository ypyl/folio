## MODIFIED Requirements

### Requirement: Vault selection persists across reloads
Every previously chosen vault folder SHALL be restored on app start: each stored folder whose permission is still granted SHALL reopen silently, and the folder that was last active SHALL become the active one. Stored folders whose permission is not granted SHALL NOT reopen; a folder whose permission is pending SHALL remain listed and re-grant without re-picking when its rail entry is activated, while a folder whose permission is denied SHALL be dropped. Adding a folder from the picker SHALL be additive — previously opened folders remain listed. Re-picking an already-listed folder SHALL activate the existing entry rather than add a duplicate. Until any folder is open, the app SHALL keep showing the mock vault.

#### Scenario: A granted stored folder reopens silently on load
- **WHEN** the app starts and one or more stored folders have granted permission
- **THEN** each granted folder is restored without any user interaction, and the folder that was last active is the active folder

#### Scenario: A stored folder with pending permission reconnects without re-picking
- **WHEN** the user activates a listed folder whose stored permission is pending
- **THEN** the app requests permission for that stored folder, and when granted, the folder becomes active and is not re-picked

#### Scenario: Opening a new folder from the picker becomes the stored folder
- **WHEN** the user picks a folder that was not previously listed
- **THEN** the folder becomes active and is stored alongside the previously opened folders, which remain listed

#### Scenario: A denied stored folder falls back to the picker
- **WHEN** a stored folder's permission is denied
- **THEN** the denied folder is dropped from the list, the remaining granted folders still reopen, and the picker remains the path for opening a replacement through the add control

#### Scenario: The open state shows the folder name and a file count
- **WHEN** a folder is active
- **THEN** the header shows the active folder's name and the number of files reachable under its root, taken when the folder was opened

#### Scenario: No stored folder leaves the mock vault visible
- **WHEN** the app starts and no folder has been stored
- **THEN** the mock vault remains the visible content and adding a folder remains available

#### Scenario: Re-picking a listed folder activates the existing entry
- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate entry is added and the existing entry for that folder becomes active