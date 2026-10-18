# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
rule. With no page open, or with a board open, the menu SHALL offer no reminder
items.

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

### Requirement: Setting a reminder from a day writes one rule

Setting a reminder from a day menu SHALL write one rule for the open page and
SHALL NOT create a page or a note.

#### Scenario: Setting a reminder writes only the rule

- **GIVEN** an open page and a calendar day
- **WHEN** the user sets a reminder for that day
- **THEN** `.folio/reminders.md` gains or keeps one rule for the page and no page
  or note file is created

## REMOVED Requirements

### Requirement: Opening a day derives its reminders and writes nothing

**Reason**: replaced by materialization. A due occurrence is now written into the
day's note when the day is opened, so the section that showed pending rows is
gone.

**Migration**: none. Opening a matching day now writes the line.

### Requirement: The badge counts the open day's pending reminders

**Reason**: with materialization, a pending count is momentary. The badge now
counts the day's matching rules.

**Migration**: none. The badge still reports the open day's reminder count.

### Requirement: A rule the day already references shows as recorded

**Reason**: the right-panel Reminders section that showed recorded rows is
removed. A written reference line is the record.

**Migration**: none. No behavior is lost; the section that displayed it is gone.

### Requirement: Acting on a pending reminder writes one reference line

**Reason**: replaced by materialization on open. There is no pending row to
activate.

**Migration**: none. The line is now written when the day is opened.

### Requirement: The user sets a reminder from the open day

**Reason**: creation moved from the right-panel form to the calendar day menu.

**Migration**: set a reminder from the Journal calendar's day menu, acting on the
open page, as the added requirement states.
