# reminders Specification

## Purpose

Reminders surface a page on the days a schedule names, using the vault's own
pages, references, and journal days. A recurring date such as a birthday or a
bill reappears when its day comes, with no backend and no scheduler.

## Requirements

### Requirement: A reminder is a page referenced from a journal day

A reminder SHALL be an ordinary page. A journal day whose note references a
reminder page SHALL be one of that reminder's occurrences, and the reminder
page's backlinks SHALL list every day that referenced it. A reminder page SHALL
be openable, referenceable, and searchable like any other page.

#### Scenario: A journal line records an occurrence

- **GIVEN** a page named `Take pills` and a journal day whose note references it
- **WHEN** the user opens the page `Take pills`
- **THEN** its backlinks list that journal day

#### Scenario: A reminder page is a normal page

- **WHEN** a reminder page exists in the vault
- **THEN** it opens, can be referenced, and appears in search like any page

### Requirement: Reminder rules live in the vault's app-owned state

The app SHALL keep reminder rules in the vault's `.folio/` directory as plain
Markdown, so the rules travel with the folder, survive reopening, and remain
editable by any tool. The rules SHALL NOT appear as a page, a search result, or
a reference source. A rule whose line does not have the rule shape SHALL be
ignored.

#### Scenario: Rules survive closing and reopening

- **GIVEN** a vault with a reminder rule set
- **WHEN** the folder is closed and reopened
- **THEN** the rule is still in effect

#### Scenario: Rules are invisible as content

- **WHEN** the user browses the Files listing or searches
- **THEN** nothing appears for the reminder rules themselves

#### Scenario: A malformed rule is ignored

- **GIVEN** `.folio/reminders.md` holds a line that is not a valid rule
- **WHEN** the app reads the rules
- **THEN** that line has no effect and the other rules still apply

### Requirement: A rule names a recurrence, an anchor date, and a page

A rule SHALL carry a recurrence, an anchor calendar date, and a reference to a
reminder page. The recurrence SHALL be one of `once`, `daily`, `weekly`,
`monthly`, or `yearly`. The reference SHALL be one of the two forms of
ADR-0012, so a rule can never name something the app cannot resolve, and a
reference to a page that does not exist yet SHALL be valid. A page SHALL have at
most one rule; setting a reminder for a page that already has one SHALL replace
it.

#### Scenario: Every recurrence is a rule

- **WHEN** the user sets a reminder with any of the five recurrences
- **THEN** the app stores one rule carrying that recurrence, its anchor date,
  and the reminder page's reference

#### Scenario: Setting a second reminder for a page replaces the first

- **GIVEN** a page that already has a rule
- **WHEN** the user sets a reminder for that page with another recurrence
- **THEN** the page has one rule, the new one, and the old one is gone

#### Scenario: A rule may name a page that does not exist yet

- **GIVEN** a rule referencing a page with no file
- **WHEN** the app reads the rules
- **THEN** the rule is still in effect and no page is created

### Requirement: A rule matches a day by its recurrence

The app SHALL decide whether a rule matches a day when that day is open.
`once` SHALL match its anchor day only. `daily` SHALL match the anchor day and
every day after it. `weekly` SHALL match the anchor's weekday from the anchor
day on. `monthly` SHALL match the anchor's day-of-month from the anchor day on.
`yearly` SHALL match the anchor's month-day.

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

#### Scenario: A once rule matches only its anchor day

- **GIVEN** a `once` rule anchored on a day
- **WHEN** the user opens that day, then a day after it
- **THEN** the rule matches on the anchor day and not on the later day

### Requirement: A date that a period does not hold is skipped

A monthly rule SHALL NOT match a month that has no such day-of-month, and a
yearly rule anchored on February 29 SHALL NOT match a year that is not a leap
year. The rule SHALL NOT move to another day of that period.

#### Scenario: The 31st in a short month is skipped

- **GIVEN** a `monthly` rule anchored on the 31st
- **WHEN** the user opens a month with 30 days
- **THEN** the rule does not match that month

#### Scenario: February 29 skips common years

- **GIVEN** a `yearly` rule anchored on February 29
- **WHEN** the user opens February 28 of a common year
- **THEN** the rule does not match

### Requirement: Opening a day derives its reminders and writes nothing

While a journal day is open, the app SHALL derive that day's reminders from the
rules. For each rule, the day SHALL show a recorded row when the day already
references the rule's page, and a pending row when the rule matches the day and
the day does not reference it; otherwise the rule SHALL produce no row. Deriving
them SHALL NOT write any file, and opening a day SHALL create nothing.

#### Scenario: Deriving creates nothing

- **GIVEN** a vault with a due rule
- **WHEN** the user opens the matching day and does not act
- **THEN** the folder holds no new reminder line and the day's note is unchanged

#### Scenario: A rule that does not match and is not referenced shows no row

- **GIVEN** a `weekly` rule that does not match the open day
- **WHEN** the user looks at the day's reminders
- **THEN** the rule produces no row

### Requirement: A rule the day already references shows as recorded

When a journal day's note already references a rule's page, the app SHALL treat
that occurrence as recorded and SHALL NOT list it among the day's pending
reminders.

#### Scenario: A written line clears the pending row

- **GIVEN** a `daily` rule whose page the open day's note already references
- **WHEN** the user opens that day
- **THEN** the rule is shown as recorded, not pending

### Requirement: Acting on a pending reminder writes one reference line

Activating a pending reminder SHALL add one reference to its page at the end of
the open day's note, in one of the two ADR-0012 forms, so the normal save writes
it. That line SHALL be the occurrence's record and SHALL make the reminder
page's backlinks include the day. The app SHALL write no reminder line except on
this action.

#### Scenario: Activating a reminder records it

- **GIVEN** an open day showing a pending reminder
- **WHEN** the user activates it
- **THEN** the day's note gains one reference to that page, and the reminder's
  backlinks then list that day

#### Scenario: No other action writes a reminder line

- **GIVEN** an open day with pending reminders
- **WHEN** the user opens and closes it, or scrolls the reminders list
- **THEN** the day's note is unchanged

### Requirement: The badge counts the open day's pending reminders

The app SHALL set the app-icon badge to the number of the open day's pending
reminders when the badge API is available, and SHALL clear the badge when that
number is zero or no journal day is open.

#### Scenario: The badge counts pending reminders

- **GIVEN** an open day with two pending reminders
- **WHEN** the app renders
- **THEN** the app-icon badge shows two

#### Scenario: The badge clears

- **GIVEN** the badge showing the day's pending reminders
- **WHEN** none remain pending
- **THEN** the badge is cleared

### Requirement: The user sets a reminder from the open day

While a journal day is open, the app SHALL offer a control to add a reminder
whose anchor defaults to that day. Setting one SHALL write a single rule and
SHALL NOT write a page or a note. The user SHALL be able to set the recurrence
and choose the reminder page.

#### Scenario: Setting a reminder writes one rule

- **GIVEN** an open day
- **WHEN** the user adds a reminder for a page with a chosen recurrence
- **THEN** `.folio/reminders.md` gains one rule for it and no page or note file
  is created

### Requirement: A reminder can be removed

Removing a reminder SHALL delete its rule from the app-owned rule file. It SHALL
NOT delete the reminder page or any journal line already written, so the
reminder page's backlinks and the day's note remain. The action SHALL be offered
on every reminder row. Removing the last rule SHALL leave the rule file readable
with no rules.

#### Scenario: Removing stops future occurrences

- **GIVEN** a `daily` rule
- **WHEN** the user removes the reminder
- **THEN** a later day shows no pending row for it

#### Scenario: The record stays

- **GIVEN** a rule whose page an earlier day's note already references
- **WHEN** the user removes the reminder
- **THEN** that note still references the page and the page's backlinks still
  list that day

#### Scenario: A page with no rule produces no reminder row

- **GIVEN** a day referencing a page with no rule
- **WHEN** the user looks at the day's reminders
- **THEN** the page produces no row and there is no removal action for it

#### Scenario: The last rule leaves a readable file

- **GIVEN** a vault with one reminder rule
- **WHEN** the user removes it
- **THEN** the rule file holds no rule and reads cleanly
