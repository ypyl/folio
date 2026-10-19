# Spec Delta

## MODIFIED Requirements

### Requirement: The reminders feature is gated by a flag

The app SHALL gate the reminders feature behind a build-time flag that is off in
the shipped build, and SHALL enable it while prerelease mode is on. While the
feature is disabled (the flag off and prerelease mode off), the Journal
calendar's day menu SHALL offer no reminder items, the app SHALL set no reminder
badge, and opening a journal day SHALL materialize no reminder line. While it is
enabled, the feature's other requirements apply. The rule parser, the matcher,
and the handling of `.folio/reminders.md` SHALL remain regardless.

#### Scenario: With the flag off, the day menu offers no reminder items

- **GIVEN** an open page, the reminders flag off, and prerelease mode off
- **WHEN** the user opens a day menu
- **THEN** the menu offers no reminder items

#### Scenario: With the flag off, no badge is set

- **GIVEN** an open day a rule would match, the reminders flag off, and
  prerelease mode off
- **WHEN** the app renders
- **THEN** no reminder badge is set

#### Scenario: With the flag off, opening a due day writes nothing

- **GIVEN** a vault with a rule, the reminders flag off, and prerelease mode off
- **WHEN** the user opens the day it matches
- **THEN** the day's note is unchanged

#### Scenario: Prerelease mode enables the feature

- **GIVEN** the reminders flag off and prerelease mode on
- **WHEN** the user opens a day menu for an open page
- **THEN** the menu offers the reminder items
