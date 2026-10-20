# Spec Delta

## MODIFIED Requirements

### Requirement: A calendar day offers reminder items for any day

The Journal calendar's day cells SHALL offer a context menu of reminder items
acting on the currently open page as the target and the clicked day as the
anchor: `Once, on this day`, `Every day`, `Every week`, `Every month`, and
`Every year`, under a `Reminder` heading, and only when the open item is a page,
not a journal day or a board. Only `Once, on this day` SHALL be unavailable for a
day before today. Choosing a recurrence SHALL ask for confirmation before it
replaces a rule the page already has.

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
- **WHEN** the user chooses another recurrence on a day and confirms the
  replacement
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

#### Scenario: The day menu offers no removal item

- **GIVEN** an open page that has a rule
- **WHEN** the user opens a day menu
- **THEN** the menu offers the five recurrence items and no `Remove reminder`
  item

#### Scenario: A replacement asks before it writes

- **GIVEN** an open page that already has a rule
- **WHEN** the user chooses another recurrence on a day
- **THEN** a confirmation names the page, the rule that would be replaced, and
  the choice being made, and the stored rule is unchanged until it is confirmed

#### Scenario: Cancelling a replacement keeps the current rule

- **GIVEN** the replacement confirmation is open
- **WHEN** the user cancels it, by its cancel control or with `Escape`
- **THEN** the page keeps its existing rule, its anchor unchanged, and nothing is
  written

#### Scenario: A first reminder asks nothing

- **GIVEN** an open page with no rule
- **WHEN** the user chooses a recurrence on a day
- **THEN** the rule is written without a confirmation

### Requirement: A reminder can be removed

Removing a reminder SHALL delete its rule from the app-owned rule file, and SHALL
be offered only from the reminded page's own row menu. It SHALL NOT delete the
reminder page or any journal line already written, so the reminder page's
backlinks and the day's note remain. Removing the last rule SHALL leave the rule
file readable with no rules.

#### Scenario: Removing stops future occurrences

- **GIVEN** a `daily` rule
- **WHEN** the user removes the reminder from the page's row menu
- **THEN** a later day materializes no line for it

#### Scenario: The record stays

- **GIVEN** a rule whose page an earlier day's note already references
- **WHEN** the user removes the reminder
- **THEN** that note still references the page and the page's backlinks still
  list that day

#### Scenario: A page with no rule produces no reminder row

- **GIVEN** a page with no rule
- **WHEN** the user opens that page's row menu
- **THEN** the menu offers no `Remove reminder` item

#### Scenario: The last rule leaves a readable file

- **GIVEN** a vault with one reminder rule
- **WHEN** the user removes it
- **THEN** the rule file holds no rule and reads cleanly
