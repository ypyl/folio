## ADDED Requirements

### Requirement: Vault selection persists across reloads
A previously chosen vault folder SHALL be restored on app start. The app SHALL persist the chosen folder in a way that survives reloads, and reopen it silently when permission is still granted. When permission is not granted, the app SHALL offer the open-folder action that re-grants the same folder without having the user re-pick it; only when no usable stored folder exists SHALL the app fall back to the platform picker. Until a folder is open, the app SHALL keep showing the mock vault.

#### Scenario: A granted stored folder reopens silently on load
- **WHEN** the app starts and a previously chosen folder is stored and still has granted permission
- **THEN** the vault opens to that folder without any user interaction, and the open state shows the folder's name

#### Scenario: A stored folder with pending permission reconnects without re-picking
- **WHEN** the open-folder action is invoked and a stored folder exists but its permission is not currently granted
- **THEN** the app requests permission for the stored folder, and when granted, the vault opens to that same folder; the folder is not re-picked

#### Scenario: Opening a new folder from the picker becomes the stored folder
- **WHEN** the user picks a folder that was not previously stored
- **THEN** the folder becomes the open vault and is stored for future sessions, replacing any previously stored folder

#### Scenario: A denied stored folder falls back to the picker
- **WHEN** the open-folder action is invoked and the stored folder's permission is denied or the stored handle is no longer usable
- **THEN** the stored folder is dropped and the platform picker is shown, and the first subsequent pick becomes the stored folder

#### Scenario: The open state shows the folder name and a file count
- **WHEN** a vault is open
- **THEN** the header shows the folder's name and the number of files reachable under the vault root, taken when the folder opened

#### Scenario: No stored folder leaves the mock vault visible
- **WHEN** the app starts and no folder has been stored
- **THEN** the mock vault remains the visible content and the open-folder action is available