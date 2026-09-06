## MODIFIED Requirements

### Requirement: VaultStorage exposes read, write, delete, list, and stat
The vault storage SHALL expose five async operations: `read(path)` returning the file's text content, `write(path, content)` creating or overwriting a file, `delete(path)` removing a file, `list(path)` returning the files reachable under a path, and `stat(path)` returning the file's last-modified time in milliseconds since the epoch.

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