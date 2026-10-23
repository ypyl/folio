# Spec Delta

## REMOVED Requirements

### Requirement: The reminders feature is gated by a flag

The app SHALL gate the reminders feature behind a build-time flag that is off in
the shipped build, and SHALL enable it while prerelease mode is on. While the
feature is disabled (the flag off and prerelease mode off), the Journal
calendar's day menu SHALL offer no reminder items, the app SHALL set no reminder
badge, and opening a journal day SHALL materialize no reminder line. While it is
enabled, the feature's other requirements apply. The rule parser, the matcher,
and the handling of `.folio/reminders.md` SHALL remain regardless.

**Reason**: Reminders are released. The gate existed while the feature was
half-settled — no menu heading, a silent replacement, no past-day rule, removal
in the wrong place — and all of that has landed since, so the flag only hid a
finished feature. The rule parser, the matcher, and the `.folio/reminders.md`
handling never depended on the gate and are unchanged.

**Migration**: The `VITE_REMINDERS` build flag and prerelease mode (whose only
consumer it was) are deleted. Vault content is untouched: stored rules stay in
effect, and a vault with no rules sees only the day menu's reminder items.

### Requirement: A reminder can be removed from its page's row

A page row whose page has a reminder rule SHALL offer `Remove reminder` in its
row menu while the reminders feature is enabled, describing the schedule it
removes beneath the label in the same words the replacement confirmation uses.
Activating it SHALL delete that page's rule, exactly as the day menu's item does,
whether or not the page is open; it SHALL NOT delete the page or any journal
line. A row whose page has no rule SHALL offer no such item, and neither SHALL
any row while the feature is disabled. The item SHALL NOT open the page.

**Reason**: The feature is no longer gated, so its enabled/disabled clauses and
the scenario that asserted them cannot hold. Restated below without the gate;
the behaviour is unchanged.

**Migration**: Removal is always offered for a page that has a rule.

## ADDED Requirements

### Requirement: An occurrence is written without moving the view

When opening a day materializes an occurrence, the app SHALL append the line
without moving the caret or the selection and without scrolling the note, so
opening a day reads where the page left it. The line SHALL be an ordinary
document edit: it SHALL follow the same save path as a typed line and it SHALL be
undoable.

#### Scenario: The caret stays where it was

- **GIVEN** a day's note with its caret in its first line and a rule that matches
  the day whose page the note does not reference
- **WHEN** the day is opened
- **THEN** the note gains the reference line at its end and the caret is still in
  its first line

#### Scenario: The note is not scrolled

- **GIVEN** a day's note longer than the editor pane, scrolled to its top, and a
  rule that matches the day
- **WHEN** the day is opened
- **THEN** the note gains the line and the editor is still scrolled to the top

### Requirement: A page row marks a page that has a reminder

A page row whose page has a reminder rule SHALL show a reminder marker in the
listing, in the badge treatment the kind badges use, and SHALL keep the page's
name as its accessible name. The marker SHALL be presentational: it SHALL NOT be
a control, SHALL NOT be focusable, and SHALL NOT change what activating the row
does.

#### Scenario: A page with a rule is marked

- **GIVEN** a page with a reminder rule
- **WHEN** the Files listing renders
- **THEN** that page's row shows a reminder marker

#### Scenario: A page with no rule carries no marker

- **GIVEN** a page with no reminder rule
- **WHEN** the Files listing renders
- **THEN** that page's row shows no reminder marker

#### Scenario: The marker is not a control

- **WHEN** the user activates a marked row
- **THEN** the row opens its page, and the marker adds no stop to the keyboard
  order

### Requirement: A reminder is removed from its page's row menu

A page row whose page has a reminder rule SHALL offer `Remove reminder` in its
row menu, describing the schedule it removes beneath the label in the same words
the replacement confirmation uses. Activating it SHALL delete that page's rule,
exactly as the day menu's item does, whether or not the page is open; it SHALL
NOT delete the page or any journal line. A row whose page has no rule SHALL offer
no such item. The item SHALL NOT open the page.

#### Scenario: Removing from the row without opening the page

- **GIVEN** a page with a rule and another page open
- **WHEN** the user activates the removal item on the first page's row menu
- **THEN** that page's rule is gone and the open page and editor are unchanged

#### Scenario: The row targets its own page

- **GIVEN** page A with a rule and page B open without one
- **WHEN** the user activates the removal item on page A's row menu
- **THEN** page A's rule is removed and page B gains none

#### Scenario: A row with no rule offers no removal

- **GIVEN** a page with no rule
- **WHEN** the user opens that page row's menu
- **THEN** the menu offers no `Remove reminder` item

#### Scenario: The written record stays

- **GIVEN** a rule whose page an earlier day's note already references
- **WHEN** the user removes the reminder from the page's row menu
- **THEN** the page exists, that note still references it, and its backlinks
  still list that day

#### Scenario: A daily rule names its anchor in the item

- **GIVEN** a page whose rule is `daily` anchored on 2026-10-06
- **WHEN** the user opens that page row's menu
- **THEN** the item is labelled `Remove reminder` and shows `every day from
  October 6, 2026` beneath the label

#### Scenario: A one-off rule names its day in the item

- **GIVEN** a page whose rule is `once` anchored on 2026-10-20
- **WHEN** the user opens that page row's menu
- **THEN** the item is labelled `Remove reminder` and shows `once, on October 20,
  2026` beneath the label
