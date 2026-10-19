# Spec Delta

## MODIFIED Requirements

### Requirement: A calendar day offers reminder items for the open page

The Journal calendar's day cells SHALL offer a context menu of reminder items
acting on the currently open page as the target and the clicked day as the
anchor: `Once, on this day`, `Every day`, `Every week`, `Every month`, `Every
year`, and `Remove reminder` when the open page has a rule. Choosing a recurrence
SHALL set the open page's single rule anchored on that day, replacing an existing
rule. The items SHALL be offered only when the open item is a page, not a journal
day. With no page open, with a journal day open, or with a board open, the menu
SHALL offer no reminder items. The reminder items SHALL appear under a `Reminder`
heading.

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
