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

### Requirement: A reminder can be removed

Removing a reminder SHALL delete its rule from the app-owned rule file. It SHALL
NOT delete the reminder page or any journal line already written, so the reminder
page's backlinks and the day's note remain. Removing the last rule SHALL leave
the rule file readable with no rules.

#### Scenario: Removing stops future occurrences

- **GIVEN** a `daily` rule
- **WHEN** the user removes the reminder from the day menu
- **THEN** a later day materializes no line for it

#### Scenario: The record stays

- **GIVEN** a rule whose page an earlier day's note already references
- **WHEN** the user removes the reminder
- **THEN** that note still references the page and the page's backlinks still
  list that day

#### Scenario: A page with no rule produces no reminder row

- **GIVEN** an open page with no rule
- **WHEN** the user opens the day menu
- **THEN** the menu offers no `Remove reminder` item

#### Scenario: The last rule leaves a readable file

- **GIVEN** a vault with one reminder rule
- **WHEN** the user removes it
- **THEN** the rule file holds no rule and reads cleanly

### Requirement: A reminder can be removed from its page's row

A page row whose page has a reminder rule SHALL offer `Remove reminder` in its
row menu while the reminders feature is enabled. Activating it SHALL delete that
page's rule, exactly as the day menu's item does, whether or not the page is
open; it SHALL NOT delete the page or any journal line. A row whose page has no
rule SHALL offer no such item, and neither SHALL any row while the feature is
disabled. The item SHALL NOT open the page.

#### Scenario: Removing from the row without opening the page

- **GIVEN** a page with a rule and another page open
- **WHEN** the user activates `Remove reminder` on the first page's row menu
- **THEN** that page's rule is gone and the open page and editor are unchanged

#### Scenario: The row targets its own page

- **GIVEN** page A with a rule and page B open without one
- **WHEN** the user activates `Remove reminder` on page A's row menu
- **THEN** page A's rule is removed and page B gains none

#### Scenario: A row with no rule offers no removal

- **GIVEN** a page with no rule and the reminders feature on
- **WHEN** the user opens that page row's menu
- **THEN** the menu offers no `Remove reminder` item

#### Scenario: A disabled feature offers no removal

- **GIVEN** a page with a rule and the reminders feature off
- **WHEN** the user opens that page row's menu
- **THEN** the menu offers no `Remove reminder` item and the rule still applies

#### Scenario: The written record stays

- **GIVEN** a rule whose page an earlier day's note already references
- **WHEN** the user removes the reminder from the page's row menu
- **THEN** the page exists, that note still references it, and its backlinks
  still list that day

### Requirement: Opening a day materializes a due reminder

While a journal day is open, the app SHALL write, once, one reference line for
each rule that matches the day and whose page the day's note does not already
reference. Each write SHALL add one reference in an ADR-0012 form to the day's
note, so the note holds the occurrence and the reminder page's backlinks list the
day. A rule that does not match the day, or whose page the note already
references, SHALL write nothing, and the app SHALL write only for the day being
opened.

#### Scenario: The day gains the line

- **GIVEN** a `daily` rule whose page the open day's note does not reference
- **WHEN** the user opens that day
- **THEN** the day's note gains one reference to that page and the page's
  backlinks list the day

#### Scenario: Reopening does not repeat the line

- **GIVEN** a day whose note already references a matching rule's page
- **WHEN** the user opens it again
- **THEN** the note is unchanged and holds one reference to that page

#### Scenario: A rule that does not match writes nothing

- **GIVEN** a `weekly` rule that does not match the open day
- **WHEN** the user opens that day
- **THEN** the day's note is unchanged

### Requirement: The badge counts the open day's reminders

The app SHALL set the app-icon badge to the number of the open day's rules that
match that day, whether or not their lines are written, when the badge API is
available. It SHALL clear the badge when that number is zero or no journal day
is open.

#### Scenario: The badge counts matching rules

- **GIVEN** an open day that two rules match
- **WHEN** the app renders
- **THEN** the app-icon badge shows two

#### Scenario: The badge clears

- **GIVEN** the badge showing the day's reminders
- **WHEN** the open day matches no rule
- **THEN** the badge is cleared

### Requirement: A calendar day offers reminder items for the open page

The Journal calendar's day cells SHALL offer a context menu of reminder items
acting on the currently open page as the target and the clicked day as the
anchor: `Once, on this day`, `Every day`, `Every week`, `Every month`, `Every
year`, and `Remove reminder` when the open page has a rule. Choosing a recurrence
SHALL set the open page's single rule anchored on that day, replacing an existing
rule. The items SHALL be offered only when the open item is a page, not a journal
day, and only for a day that is today or later. With no page open, with a journal
day open, with a board open, or with a day before today, the menu SHALL offer no
reminder items. The reminder items SHALL appear under a `Reminder` heading.

#### Scenario: A once reminder is anchored on the clicked day

- **GIVEN** an open page and a calendar day
- **WHEN** the user chooses `Once, on this day` for that day
- **THEN** the page has one rule with recurrence `once` anchored on that day

#### Scenario: A yearly reminder is anchored on the clicked day

- **GIVEN** an open page and a calendar day
- **WHEN** the user chooses `Every year`
- **THEN** the page has one rule with recurrence `yearly` anchored on that day,
  and a later year's same month-day materializes a line

#### Scenario: Choosing a recurrence replaces the page's rule

- **GIVEN** an open page that already has a rule
- **WHEN** the user chooses another recurrence on a day
- **THEN** the page has one rule, the new anchor and recurrence, and the old rule
  is gone

#### Scenario: No reminder items without an open page

- **WHEN** no page is open and the user opens the day menu
- **THEN** the menu offers no reminder items

#### Scenario: A journal day offers no reminder items

- **GIVEN** an open journal day
- **WHEN** the user opens a day menu
- **THEN** the menu offers no reminder items

#### Scenario: The day menu names the reminder group

- **GIVEN** an open page and a day menu with reminder items
- **WHEN** the user looks at the menu
- **THEN** the items appear under a visible `Reminder` heading, and assistive
  technology reads them as a group named `Reminder`

#### Scenario: A day before today offers no reminder items

- **GIVEN** an open page and a day before today
- **WHEN** the user opens that day's menu
- **THEN** the menu offers no reminder items

### Requirement: Setting a reminder from a day writes one rule

Setting a reminder from a day menu SHALL write one rule for the open page and
SHALL NOT create a page or a note.

#### Scenario: Setting a reminder writes only the rule

- **GIVEN** an open page and a calendar day
- **WHEN** the user sets a reminder for that day
- **THEN** `.folio/reminders.md` gains or keeps one rule for the page and no page
  or note file is created

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
