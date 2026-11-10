# Spec Delta

## ADDED Requirements

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
