## ADDED Requirements

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