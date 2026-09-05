## Purpose

Delta for the `vault-storage` capability: the FSA implementation makes the contract concrete, extends `delete` to directories, and gains a picker-backed factory.

## MODIFIED Requirements

### Requirement: VaultStorage exposes read, write, delete, and list
The vault storage SHALL expose four async operations: `read(path)` returning the file's text content, `write(path, content)` creating or overwriting a file, `delete(path)` removing a file, and `list(path)` returning the files reachable under a path.

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

## ADDED Requirements

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