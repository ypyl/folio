# Spec Delta

## ADDED Requirements

### Requirement: A one-off that missed its day is due on today

A `once` rule SHALL be due on today's journal when its anchor day is before
today and no journal day on or after the anchor references its page. Opening
today SHALL materialize its occurrence as any due rule's, and it SHALL stop
being due once such a journal day exists, so the occurrence lands once. A
`once` rule anchored on today or later SHALL NOT be carried, and no other
recurrence SHALL be carried.

#### Scenario: The missed one-off lands on today

- **GIVEN** a `once` rule anchored on a past day, whose page no journal day on or
  after the anchor references
- **WHEN** the user opens today's journal
- **THEN** today's note gains one line `- [ ] #[[Page]]` for that page, and the
  page's backlinks list today

#### Scenario: The carried line lands once

- **GIVEN** a pending one-off carried into today's note, whose line is saved and
  unticked
- **WHEN** the user reopens today
- **THEN** the note still holds one line for that page and the app-icon badge
  still counts it

#### Scenario: A recorded occurrence is not carried

- **GIVEN** a `once` rule anchored on a past day whose page a journal day on or
  after the anchor references
- **WHEN** the user opens today's journal
- **THEN** today's note gains no line for that page and the badge does not count
  it

#### Scenario: A one-off anchored later is not carried

- **GIVEN** a `once` rule anchored on a day after today
- **WHEN** the user opens today's journal
- **THEN** today's note gains no line for that page

#### Scenario: Only today carries a missed one-off

- **GIVEN** a pending one-off and a journal day before today
- **WHEN** the user opens that day
- **THEN** the day's note gains no line for that page

#### Scenario: A recurring rule is never carried

- **GIVEN** a `weekly` rule anchored on a past weekday that today does not match
- **WHEN** the user opens today's journal
- **THEN** today's note gains no line for that page

### Requirement: A ticked one-off is retired from the rule file

A `once` rule whose anchor day is the open day or earlier SHALL be deleted from
`.folio/reminders.md` when the open day's note records its page as done, so the
one-off's page row shows no reminder marker and offers no removal item. The
journal line, the reminder page, and the page's backlinks SHALL remain. A `once`
rule anchored after the open day SHALL NOT be retired, and no recurring rule
SHALL be retired.

#### Scenario: Ticking a one-off retires its rule

- **GIVEN** a `once` rule anchored on the open day and a note recording its page
  as done
- **WHEN** the note is saved
- **THEN** the rule file holds no rule for that page and the page's row shows no
  reminder marker

#### Scenario: Retirement keeps the record

- **GIVEN** a `once` rule retired by a tick
- **WHEN** the user opens the reminder page
- **THEN** the page exists, the journal note still holds the ticked line, and the
  page's backlinks still list that day

#### Scenario: An unticked one-off keeps its rule

- **GIVEN** a `once` rule anchored on the open day and a note whose line for its
  page is unticked
- **WHEN** the note is saved
- **THEN** the rule is still in effect

#### Scenario: A one-off anchored later is not retired

- **GIVEN** a `once` rule anchored on a day after the open day and a note
  recording its page as done
- **WHEN** the note is saved
- **THEN** the rule is still in effect

#### Scenario: A recurring rule is not retired by a tick

- **GIVEN** a `daily` rule and a note recording its page as done
- **WHEN** the note is saved
- **THEN** the rule is still in effect

#### Scenario: Retiring the last rule leaves a readable file

- **GIVEN** a vault whose only rule is a ticked `once` rule
- **WHEN** the note is saved
- **THEN** `.folio/reminders.md` holds no rule and reads cleanly

## MODIFIED Requirements

### Requirement: A rule matches a day by its recurrence

The app SHALL decide whether a rule matches a day when that day is open.
`once` SHALL match its anchor day only. `daily` SHALL match the anchor day and
every day after it. `weekly` SHALL match the anchor's weekday from the anchor
day on. `monthly` SHALL match the anchor's day-of-month from the anchor day on.
`yearly` SHALL match the anchor's month-day from the anchor day on.

#### Scenario: A daily rule matches every day from its anchor

- **GIVEN** a `daily` rule anchored on a day
- **WHEN** that day or any later day is open
- **THEN** the rule matches

#### Scenario: A weekly rule matches one weekday

- **GIVEN** a `weekly` rule anchored on a Wednesday
- **WHEN** the user opens a later Wednesday
- **THEN** the rule matches, and it does not match a Thursday

#### Scenario: A monthly rule matches one day of month

- **GIVEN** a `monthly` rule anchored on the 1st of a month
- **WHEN** the user opens the 1st of a later month
- **THEN** the rule matches

#### Scenario: A yearly rule matches one month-day

- **GIVEN** a `yearly` rule anchored on 1990-04-12
- **WHEN** the user opens any later April 12
- **THEN** the rule matches

#### Scenario: A yearly rule does not match before its anchor

- **GIVEN** a `yearly` rule anchored on a day after today
- **WHEN** the user opens an earlier year's same month-day
- **THEN** the rule does not match

#### Scenario: A once rule matches only its anchor day

- **GIVEN** a `once` rule anchored on a day
- **WHEN** the user opens that day, then a day after it
- **THEN** the rule matches on the anchor day and not on the later day

### Requirement: The badge counts the open day's reminders

The app SHALL set the app-icon badge to the number of the open day's rules that
are due on that day and that the day's note does not record as done, when the
badge API is available. A rule is due when it matches the day, or when it is a
pending one-off carried into today. A rule SHALL be recorded as done when the
note holds a done task item whose text references the rule's page, while an
unticked task item, a bare reference line, and a reference in prose SHALL NOT
record it as done. It SHALL clear the badge when that number is zero or no
journal day is open.

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

#### Scenario: A carried one-off is counted

- **GIVEN** a pending one-off whose line today's note holds, unticked
- **WHEN** the app renders with today open
- **THEN** the app-icon badge counts it, and stops counting it once the line is
  ticked and saved
