# vault-storage Specification

## Purpose

The transport contract between Folio's knowledge-management core and wherever its Markdown files actually live. `VaultStorage` is the single seam through which the app reads, writes, deletes, and enumerates files in the vault folder, so the core never touches filesystem specifics directly.

## Requirements

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

#### Scenario: Listing the root returns every file in the vault
- **WHEN** `list` is called with the root path
- **THEN** it resolves with a flat array containing every file in the vault at any depth, and directories do not appear in the array

#### Scenario: Listing a directory returns the files beneath it
- **WHEN** `list` is called with the path of a directory
- **THEN** it resolves with the files under that directory, still as flat root-relative paths

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