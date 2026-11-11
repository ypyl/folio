# Spec Delta

## MODIFIED Requirements

### Requirement: A calendar day offers reminder items for any day

The Journal calendar's day cells SHALL offer a context menu of reminder items
acting on the currently open page as the target and the clicked day as the
anchor: `Once, on this day`, `Every day`, `Every week`, `Every month`, and
`Every year`, under a `Reminder` heading, and only when the open item is a page,
not a journal day or a board. The context-menu gesture SHALL be a pointer
right-click, the keyboard gesture for a context menu on the focused cell, or, on
a touch-primary device, a press held on the cell; a press that moves (a scroll)
or is released before the hold SHALL NOT open the menu, and releasing the press
after the menu opened SHALL NOT choose the day. Only `Once, on this day` SHALL be
unavailable for a day before today. Choosing a recurrence SHALL ask for
confirmation before it replaces a rule the page already has.

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

#### Scenario: A press and hold opens the day menu on a touch device

- **GIVEN** a touch-primary device, an open page, and the navigation view shown
- **WHEN** the user presses and holds a calendar day
- **THEN** that day's reminder menu opens, and that day does not open

#### Scenario: A tap on a day opens it

- **GIVEN** a touch-primary device and the navigation view shown
- **WHEN** the user presses and releases a calendar day without holding
- **THEN** that day opens and no menu opens

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
