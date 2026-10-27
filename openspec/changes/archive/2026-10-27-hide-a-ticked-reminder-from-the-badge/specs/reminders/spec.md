# Spec Delta

## MODIFIED Requirements

### Requirement: The badge counts the open day's reminders

The app SHALL set the app-icon badge to the number of the open day's rules that
match that day and that the day's note does not record as done, when the badge
API is available. A rule SHALL be recorded as done when the note holds a done
task item whose text references the rule's page, while an unticked task item, a
bare reference line, and a reference in prose SHALL NOT record it as done. It
SHALL clear the badge when that number is zero or no journal day is open.

#### Scenario: The badge counts matching rules

- **GIVEN** an open day that two rules match
- **WHEN** the app renders
- **THEN** the app-icon badge shows two

#### Scenario: The badge clears

- **GIVEN** the badge showing the day's reminders
- **WHEN** the open day matches no rule
- **THEN** the badge is cleared

#### Scenario: A ticked reminder stops being counted

- **GIVEN** an open day whose note holds `- [x] #[[Take pills]]` and one rule
  that matches the day and references `Take pills`
- **WHEN** the app renders
- **THEN** the app-icon badge is cleared

#### Scenario: A ticked reminder is one of several

- **GIVEN** an open day that two rules match, whose note holds a done task item
  referencing one of them
- **WHEN** the app renders
- **THEN** the app-icon badge shows one

#### Scenario: An unticked reminder is still counted

- **GIVEN** an open day whose note holds `- [ ] #[[Take pills]]` and one rule
  that matches the day and references `Take pills`
- **WHEN** the app renders
- **THEN** the app-icon badge shows one

#### Scenario: A plain reference does not record the reminder as done

- **GIVEN** an open day whose note holds `#[[Take pills]]` on its own line and
  one rule that matches the day and references `Take pills`
- **WHEN** the app renders
- **THEN** the app-icon badge shows one

#### Scenario: Unticking brings the reminder back

- **GIVEN** an open day whose note holds a done task item referencing a matching
  rule, recorded in the file
- **WHEN** the user unticks that item and the note is saved
- **THEN** the app-icon badge shows that rule again

#### Scenario: A done item no rule names changes nothing

- **GIVEN** an open day that one rule matches, whose note holds a done task item
  referencing a different page
- **WHEN** the app renders
- **THEN** the app-icon badge shows one
