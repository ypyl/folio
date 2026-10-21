# Spec Delta

## ADDED Requirements

### Requirement: The removal item describes the schedule it removes

The page row menu's reminder item SHALL be labelled `Remove reminder` and SHALL
describe the rule it would delete beneath that label, in smaller muted text and
in the same words the replacement confirmation uses: the recurrence and the day
it is anchored on. A `once` rule SHALL read as `once, on <day>`; every other
recurrence SHALL read as `<recurrence> from <day>`.

#### Scenario: A daily rule shows its anchor beneath the label

- **GIVEN** a page whose rule is `daily` anchored on 2026-10-06
- **WHEN** the user opens that page row's menu
- **THEN** the item is named `Remove reminder` and shows
  `every day from October 6, 2026` beneath the name

#### Scenario: A one-off rule shows its day beneath the label

- **GIVEN** a page whose rule is `once` anchored on 2026-10-20
- **WHEN** the user opens that page row's menu
- **THEN** the item is named `Remove reminder` and shows
  `once, on October 20, 2026` beneath the name

#### Scenario: Assistive technology reads the schedule as a description

- **GIVEN** a page whose rule is `weekly` anchored on 2026-10-19
- **WHEN** the item is focused
- **THEN** its accessible name is `Remove reminder` and its accessible
  description is `every week from October 19, 2026`

#### Scenario: The described item still removes that rule

- **GIVEN** a page whose described removal item is shown
- **WHEN** the user activates it
- **THEN** that page's rule is deleted and the page and its written days stay
