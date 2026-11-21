# Spec Delta

## Purpose

An app-level preference that turns on capabilities which ship behind a build-time
flag. One switch on the folder rail, shared by every vault, persisted in the
browser, so a person can try an unreleased capability without a special build and
the shipped build keeps it off.

## ADDED Requirements

### Requirement: A build-time flag gates each experimental capability

The app SHALL declare one build-time flag per experimental capability, in a
module of constants that is off unless the environment sets it
(`VITE_<NAME>=1`). A flag SHALL be a constant rather than a preference: the app
SHALL keep no settings store and the vault SHALL hold no flag. A flag SHALL be
read at call time, so a test can flip one without remounting the app.

#### Scenario: The shipped build carries the flag off

- **GIVEN** a build with no environment override
- **WHEN** the app reads a capability's flag
- **THEN** it reads off

#### Scenario: A build can turn the flag on

- **GIVEN** a build whose environment sets the capability's flag
- **WHEN** the app reads it
- **THEN** it reads on

### Requirement: The experimental switch lives on the folder rail

The folder rail SHALL offer one control that turns experimental mode on and off.
The control SHALL report its state to assistive technology (`aria-pressed`), SHALL
carry an accessible name naming it as the experimental switch, and SHALL show
visible keyboard focus. It SHALL render above the rail's bottom group, so the
bottom group continues to hold exactly one control and the tour control remains
the rail's last control.

#### Scenario: The switch flips and reports its state

- **WHEN** the user activates the experimental control
- **THEN** the mode flips and the control reports the new state

#### Scenario: The switch sits above the bottom group

- **WHEN** the rail renders with a real folder open
- **THEN** the experimental control sits above the bottom group, whose feedback
  control remains the rail's last control

#### Scenario: The tour stays the last control

- **GIVEN** the guided demo vault is active
- **WHEN** the rail renders
- **THEN** the experimental control sits above the bottom group and the tour
  control remains the rail's last control

### Requirement: Experimental mode persists across reloads

The mode SHALL be stored as a browser-local app preference, not as vault content:
it SHALL be the same for every vault, SHALL survive a reload, and SHALL write no
vault file and no vault state. Where browser storage is unavailable, the mode
SHALL read as off and the session SHALL keep the state it was given.

#### Scenario: The mode survives a reload

- **GIVEN** experimental mode is on
- **WHEN** the app reloads
- **THEN** the mode is still on

#### Scenario: The mode writes no vault file

- **GIVEN** a folder open and experimental mode on
- **WHEN** the user examines the vault
- **THEN** no file records the mode

#### Scenario: Unavailable storage reads as off

- **GIVEN** a browser whose storage is unavailable
- **WHEN** the app starts
- **THEN** the mode is off and the app does not fail

### Requirement: The effective gate is the flag or the switch

A gated capability SHALL be enabled when its build-time flag is on or experimental
mode is on, and SHALL be disabled when both are off. The effective gate SHALL be
computed once by the app composition layer and passed down, so every surface of a
capability reads the same value and no surface re-reads the flag.

#### Scenario: The switch enables a feature whose flag is off

- **GIVEN** a capability whose build-time flag is off and experimental mode on
- **WHEN** the user uses its surface
- **THEN** the capability behaves as if its flag were on

#### Scenario: Turning the mode off restores the shipped behavior

- **GIVEN** experimental mode was on and the capability's flag is off
- **WHEN** the user turns the mode off
- **THEN** the capability's surfaces are absent again

### Requirement: The experimental control explains what it enables

On hover and on keyboard focus, the experimental control SHALL show a popup
naming each capability the switch enables, one row per gated capability with a
one-line description of what turns on. The popup SHALL hide when the pointer
leaves and when focus leaves, SHALL take no pointer input so activating the
control still flips the switch, and SHALL sit beside the rail, inside the
viewport. While it is shown the control SHALL reference it through
`aria-describedby`, and the popup SHALL NOT change the control's accessible name
or its reported state. Where the build gates nothing, the popup SHALL NOT render.

#### Scenario: A hover names the gated capabilities

- **GIVEN** the build gates one capability and the switch is off
- **WHEN** the pointer rests on the experimental control
- **THEN** the popup lists that capability with its description

#### Scenario: Keyboard focus shows the popup

- **WHEN** the experimental control takes focus from the keyboard
- **THEN** the popup is shown

#### Scenario: Leaving hides the popup

- **WHEN** the pointer leaves the control, or focus moves away
- **THEN** the popup is gone

#### Scenario: The popup does not get in the way of the switch

- **WHEN** the popup is shown and the control is activated
- **THEN** the switch flips and the control reports the new state

### Requirement: Every gated capability is described

The capabilities a build gates SHALL be described in the module that declares the
flags: one description per flag, carrying the flag's key, a label, and one line of
detail. The app SHALL keep the descriptions in step with the flags in both
directions, so a flag added without a description fails the test suite and a
description naming no flag fails it too.

#### Scenario: A flag without a description is caught

- **GIVEN** a flag added to the module with no description
- **WHEN** the test suite runs
- **THEN** the coverage test fails

#### Scenario: A description naming no flag is caught

- **GIVEN** a description naming a flag the module does not declare
- **WHEN** the test suite runs
- **THEN** the coverage test fails
