# vault-storage Specification

## Purpose

The transport contract between Folio's knowledge-management core and wherever its Markdown files actually live. `VaultStorage` is the single seam through which the app reads, writes, deletes, and enumerates files in the vault folder, so the core never touches filesystem specifics directly.

## Requirements

### Requirement: VaultStorage exposes read, write, delete, list, and stat
The vault storage SHALL expose five async operations: `read(path)` returning the file's text content, `write(path, content)` creating or overwriting a file, `delete(path)` removing a file, `list(path)` returning the files reachable under a path, and `stat(path)` returning the file's last-modified time in milliseconds since the epoch. These five are the text and metadata set; binary assets are read and written through the separate binary operations the asset requirements define.

#### Scenario: Reading a file returns its text content
- **WHEN** `read` is called with the path of an existing file
- **THEN** it resolves with the file's text content as a string

#### Scenario: Writing a file creates or overwrites it
- **WHEN** `write` is called with a path and content
- **THEN** the file at that path exists with the given content, replacing any previous content

#### Scenario: Deleting a file removes it
- **WHEN** `delete` is called with the path of an existing file
- **THEN** the file no longer exists

#### Scenario: Deleting a directory removes it and its contents
- **WHEN** `delete` is called with the path of an existing directory
- **THEN** the directory and everything beneath it no longer exist

#### Scenario: Listing the root returns every file in the vault
- **WHEN** `list` is called with the root path
- **THEN** it resolves with a flat array containing every file in the vault at any depth, and directories do not appear in the array

#### Scenario: Listing a directory returns the files beneath it
- **WHEN** `list` is called with the path of a directory
- **THEN** it resolves with the files under that directory, still as flat root-relative paths

#### Scenario: Stat returns a file's last-modified time
- **WHEN** `stat` is called with the path of an existing file
- **THEN** it resolves with the file's last-modified time as a millisecond timestamp, and the value changes when the file's content is rewritten

#### Scenario: Stat rejects for a missing file
- **WHEN** `stat` is called with the path of a nonexistent file
- **THEN** the call rejects with an error

### Requirement: Paths follow the vault-relative contract
Vault paths SHALL be vault-root-relative strings using `/` as the separator, with no leading `/`, no `.` or `..` segments, and no absolute paths. The empty string SHALL denote the vault root. `list` SHALL return paths in the same form. Write operations SHALL create any missing parent directories implied by the path.

#### Scenario: Paths are root-relative and slash-separated
- **WHEN** paths are used in any vault operation
- **THEN** they are vault-root-relative, `/`-separated, with no leading slash and no `.` or `..` segments

#### Scenario: The empty string is the vault root
- **WHEN** the empty string is passed as a path
- **THEN** the operation applies to the vault root

#### Scenario: Invalid paths are rejected
- **WHEN** a path contains a `..` segment, is absolute, or otherwise violates the path contract
- **THEN** the operation rejects the call rather than attempting it

#### Scenario: Writing creates missing parent directories
- **WHEN** `write` is called with a path whose parent directory does not exist
- **THEN** the parent directories are created and the file is written

### Requirement: Missing files reject instead of returning null
`read` and `delete` SHALL reject when the target file does not exist, rather than resolving with a sentinel value.

#### Scenario: Reading a missing file rejects
- **WHEN** `read` is called with the path of a nonexistent file
- **THEN** the call rejects with an error

#### Scenario: Deleting a missing file rejects
- **WHEN** `delete` is called with the path of a nonexistent file
- **THEN** the call rejects with an error

### Requirement: A picker factory produces a VaultStorage for a chosen folder
A factory operation SHALL open the platform directory picker, and when the user chooses a folder, resolve with a `VaultStorage` whose operations act on that folder's contents. Picking the folder SHALL grant readwrite access for the current session. Permission state after the session ends (reload) is negotiated by the caller, not by the factory or storage.

#### Scenario: Picking a folder returns a working storage
- **WHEN** the picker factory is invoked and the user selects a folder
- **THEN** it resolves with a `VaultStorage` bound to that folder, and `list` on the root returns that folder's files

#### Scenario: Cancelling the picker rejects the call
- **WHEN** the picker factory is invoked and the user dismisses the picker without choosing a folder
- **THEN** the call rejects

#### Scenario: The factory does not negotiate permissions
- **WHEN** a storage obtained from a picker is used in a later session after reload
- **THEN** the storage must be granted permission by the caller before use; the factory itself performs no permission request
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

### Requirement: The storage seam provides a binary write operation for assets
The storage seam SHALL provide a binary write operation alongside its text `write`: it accepts raw bytes (not text) and writes them to a vault path under the same path contract. Text writes remain text-only — binary content never flows through the text path. The operation SHALL create missing parent directories, matching the text write's behavior.

#### Scenario: A dropped image lands byte-for-byte in the vault
- **GIVEN** an open vault and a file whose bytes are ready for storage
- **WHEN** its bytes are written through the binary write operation to `assets/photo.png`
- **THEN** the vault contains `assets/photo.png` with exactly the file's bytes, and its parent directory is created if missing

#### Scenario: The binary write operation replaces the file it is asked to write
- **GIVEN** a binary asset path that already exists in the vault
- **WHEN** the operation is invoked for that exact path
- **THEN** the file at that path is replaced with the new bytes; unique-name selection on collision is the copy flow's responsibility, not the storage operation's

### Requirement: The storage seam provides a binary read operation for assets
The storage seam SHALL provide a binary read operation alongside its binary write: `readBinary(path)` resolves with the bytes stored at a vault path, under the same path contract as every other operation. The bytes SHALL come back as they were written, and a path with no file SHALL reject rather than resolving with empty content, matching the text read.

#### Scenario: Bytes written through the binary write come back unchanged
- **GIVEN** a vault holding an image written through the binary write operation
- **WHEN** its path is read through the binary read operation
- **THEN** the result carries exactly the stored bytes

#### Scenario: Reading a missing asset rejects
- **WHEN** the binary read operation is called with the path of a file that does not exist
- **THEN** the call rejects with an error, and no empty or placeholder content is returned

#### Scenario: The binary read holds the path contract
- **WHEN** the binary read operation is called with an invalid path — absolute, or carrying a `.` or `..` segment
- **THEN** the call rejects without touching the filesystem outside the vault

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
