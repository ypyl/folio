# Spec Delta

## ADDED Requirements

### Requirement: A board name the folder cannot hold is not a board reference

A bracketed board reference whose name the folder cannot hold as a file name
SHALL NOT be a board reference. It SHALL remain literal Markdown text, SHALL NOT
be badged, and SHALL NOT resolve to a board, appear in a Links list, or open a
board on activation. The name rule is the page reference's: no `< > : " / \ |
? *` or control character, and no Windows device name, ignoring case.

#### Scenario: A board name holding a pipe is literal text

- **GIVEN** a note holding `#![[Topology | draft]]`
- **WHEN** the note is open
- **THEN** the token renders as literal text, no board opens, and no board file
  is written

#### Scenario: A writable board name still resolves

- **GIVEN** a note holding `#![[Migration topology]]`
- **WHEN** the board reference is activated
- **THEN** the board named `Migration topology` opens
