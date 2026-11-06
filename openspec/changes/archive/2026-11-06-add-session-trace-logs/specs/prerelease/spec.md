# Spec Delta

## Purpose

An app-level switch that turns on the features a build ships behind a flag, so a
person can try an unreleased capability without a special build.

## ADDED Requirements

### Requirement: An experimental switch lives on the folder rail

The folder rail SHALL offer a control that turns the experimental switch on and
off. The control SHALL report its state (`aria-pressed`) and carry an accessible
name. It SHALL render in every shell state, and the tour control SHALL stay the
rail's last control.

#### Scenario: The control turns the switch on and off

- **WHEN** the user activates the experimental control
- **THEN** the switch flips and the control reports the new state

#### Scenario: The tour stays the last control

- **WHEN** the rail renders
- **THEN** the experimental control sits before the tour control, which remains
  the rail's last control

### Requirement: The switch persists across reloads

The switch SHALL be stored as a browser-local app preference, not as vault
content: it SHALL be the same for every vault, SHALL survive a reload, and SHALL
write no vault file. Where browser storage is unavailable, it SHALL read as off.

#### Scenario: The switch survives a reload

- **GIVEN** the experimental switch is on
- **WHEN** the app reloads
- **THEN** the switch is still on

#### Scenario: The switch writes no vault file

- **GIVEN** a folder open and the switch on
- **WHEN** the user examines the vault
- **THEN** no file records the switch

### Requirement: The switch enables features that ship behind a flag

While the experimental switch is on, a feature whose build-time flag is off SHALL
be enabled. While it is off, the build-time flag SHALL decide, so the shipped
behavior is unchanged.

#### Scenario: The switch enables a gated feature

- **GIVEN** a feature whose build-time flag is off and the switch on
- **WHEN** the user uses its UI
- **THEN** the feature behaves as if its flag were on

#### Scenario: Turning the switch off restores the shipped behavior

- **GIVEN** the switch was on and the feature's build-time flag is off
- **WHEN** the user turns the switch off
- **THEN** the feature's UI is absent again
