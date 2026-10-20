# Spec Delta

## REMOVED Requirements

### Requirement: A calendar day offers reminder items for the open page

**Reason**: A past day now offers the reminder menu, with only `Once, on this
day` unavailable, so the rule that a day before today offers no reminder items no
longer holds. The requirement is replaced by one stating the same item list under
the new availability rule.

**Migration**: None needed. The feature is behind a flag, every other menu item
keeps its behavior, and rules already stored are unaffected.

## ADDED Requirements

### Requirement: A calendar day offers reminder items for any day

The Journal calendar's day cells SHALL offer a context menu of reminder items
acting on the currently open page as the target and the clicked day as the
anchor: `Once, on this day`, `Every day`, `Every week`, `Every month`, `Every
year`, and `Remove reminder` when the open page has a rule. Only `Once, on this
day` SHALL be unavailable for a day before today. The items SHALL be offered only
when the open item is a page, not a journal day, and SHALL appear under a
`Reminder` heading.

#### Scenario: A once reminder is anchored on the clicked day

- **GIVEN** an open page and a calendar day that is today or later
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

- **WHEN** no page is open and the user opens a day menu
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

#### Scenario: A past day opens the menu with Once unavailable

- **GIVEN** an open page and a day before today
- **WHEN** the user opens that day's menu
- **THEN** the menu offers the reminder items, with `Once, on this day` shown as
  unavailable and every other reminder item available

#### Scenario: An unavailable Once writes no rule

- **GIVEN** an open page with no rule and a day before today whose menu is open
- **WHEN** the user activates `Once, on this day` by pointer or keyboard
- **THEN** no rule is written and the page's reminder state is unchanged

#### Scenario: A recurring reminder can be anchored on a past day

- **GIVEN** an open page and a day before today
- **WHEN** the user chooses `Every week` for that day
- **THEN** the page has one rule with recurrence `weekly` anchored on that day

#### Scenario: The keyboard never lands on an unavailable item

- **GIVEN** a past day's menu open for an open page
- **WHEN** the user opens the menu, then presses the arrow keys, `Home`, or `End`
- **THEN** focus stays on available items and never moves to `Once, on this day`
