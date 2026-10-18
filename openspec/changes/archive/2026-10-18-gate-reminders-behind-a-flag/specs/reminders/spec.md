# Spec Delta

## ADDED Requirements

### Requirement: The reminders feature is gated by a flag

The app SHALL gate the reminders feature behind a build-time flag that is off in
the shipped build. While the flag is off, the Journal calendar's day menu SHALL
offer no reminder items, the app SHALL set no reminder badge, and opening a
journal day SHALL materialize no reminder line. While it is on, the feature's
other requirements apply. The rule parser, the matcher, and the handling of
`.folio/reminders.md` SHALL remain regardless.

#### Scenario: With the flag off, the day menu offers no reminder items

- **GIVEN** an open page and the reminders flag off
- **WHEN** the user opens a day menu
- **THEN** the menu offers no reminder items

#### Scenario: With the flag off, no badge is set

- **GIVEN** an open day a rule would match and the reminders flag off
- **WHEN** the app renders
- **THEN** no reminder badge is set

#### Scenario: With the flag off, opening a due day writes nothing

- **GIVEN** a vault with a rule and the reminders flag off
- **WHEN** the user opens the day it matches
- **THEN** the day's note is unchanged
