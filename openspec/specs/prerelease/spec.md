# prerelease Specification

## Purpose

An app-level preference that turns on features which ship behind a flag. It is
one switch, visible on the folder rail, persisted across reloads, and shared by
every vault, so a person can try an unreleased feature without a special build.

## Requirements

### Requirement: A prerelease mode toggle lives on the folder rail

The folder rail SHALL offer a control that turns prerelease mode on and off. The
control SHALL report its state (`aria-pressed`) and carry an accessible name. It
SHALL render in every shell state, and the tour control SHALL stay the rail's
last control.

#### Scenario: The control turns the mode on and off

- **WHEN** the user activates the prerelease control
- **THEN** the mode flips and the control reports the new state

#### Scenario: The tour stays the last control

- **WHEN** the rail renders
- **THEN** the prerelease control sits before the tour control, which remains the
  rail's last control

### Requirement: Prerelease mode persists across reloads

The mode SHALL be stored as a browser-local app preference, not as vault
content: it SHALL be the same for every vault, SHALL survive a reload, and SHALL
write no vault file. Where browser storage is unavailable, the mode SHALL read as
off.

#### Scenario: The mode survives a reload

- **GIVEN** prerelease mode is on
- **WHEN** the app reloads
- **THEN** the mode is still on

#### Scenario: The mode writes no vault file

- **GIVEN** a folder open and prerelease mode on
- **WHEN** the user examines the vault
- **THEN** no file records the mode

### Requirement: Prerelease mode enables features that ship behind a flag

While prerelease mode is on, a feature whose build-time flag is off SHALL be
enabled. While it is off, the build-time flag SHALL decide, so the shipped
behavior is unchanged.

#### Scenario: The mode enables a gated feature

- **GIVEN** a feature whose build-time flag is off and prerelease mode on
- **WHEN** the user uses its UI
- **THEN** the feature behaves as if its flag were on

#### Scenario: Turning the mode off restores the shipped behavior

- **GIVEN** prerelease mode was on and the feature's build-time flag is off
- **WHEN** the user turns the mode off
- **THEN** the feature's UI is absent again
