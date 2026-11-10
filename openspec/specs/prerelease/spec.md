# prerelease Specification

## Purpose
An app-level switch that turns on the features a build ships behind a flag, so a
person can try an unreleased capability without a special build.

## Requirements

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

### Requirement: The experimental control explains what it enables

On hover and on keyboard focus, the experimental control SHALL show a popup
naming each feature the switch enables, one row per gated feature with a
one-line description of what turns on. The popup SHALL hide when the pointer
leaves and when focus leaves, and SHALL take no pointer input, so activating the
control still flips the switch.

#### Scenario: A hover names the gated features

- **GIVEN** the build gates one feature and the switch is off
- **WHEN** the pointer rests on the experimental control
- **THEN** the popup lists that feature with its description

#### Scenario: Keyboard focus shows the popup

- **WHEN** the experimental control takes focus from the keyboard
- **THEN** the popup is shown

#### Scenario: Leaving hides the popup

- **WHEN** the pointer leaves the control, or focus moves away
- **THEN** the popup is gone

#### Scenario: The popup does not get in the way of the switch

- **WHEN** the popup is shown and the control is activated
- **THEN** the switch flips and the control reports the new state

### Requirement: The popup sits beside the rail and describes the control

The popup SHALL be a small floating surface laid out beside the control, to the
right of the rail and inside the viewport. While shown, the control SHALL
reference it through `aria-describedby`, and the popup SHALL NOT change the
control's accessible name or its `aria-pressed` state.

#### Scenario: The popup sits beside the rail

- **GIVEN** a viewport wider than the rail
- **WHEN** the popup is shown
- **THEN** it is laid out to the right of the rail and inside the viewport

#### Scenario: The control is described while the popup shows

- **WHEN** the popup is shown
- **THEN** the control's description is the popup's text and its name still reads
  as the control's own

### Requirement: Every gated feature is described

The features a build gates SHALL be described in the same module that declares
the flags, one description per flag, so the popup can never omit a gated
feature. The app SHALL keep the descriptions in step with the flags.

#### Scenario: A flag without a description is caught

- **GIVEN** a build-time flag with no description
- **WHEN** the suite runs
- **THEN** the coverage test fails, naming the flag
