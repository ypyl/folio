# Spec Delta

## MODIFIED Requirements

### Requirement: A reminder can be removed from its page's row

A page row whose page has a reminder rule SHALL offer `Remove reminder` in its
row menu while the reminders feature is enabled, named with the schedule it
removes — the same words the replacement confirmation uses. Activating it SHALL
delete that page's rule, exactly as the day menu's item does, whether or not the
page is open; it SHALL NOT delete the page or any journal line. A row whose page
has no rule SHALL offer no such item, and neither SHALL any row while the feature
is disabled. The item SHALL NOT open the page.

#### Scenario: Removing from the row without opening the page

- **GIVEN** a page with a rule and another page open
- **WHEN** the user activates the removal item on the first page's row menu
- **THEN** that page's rule is gone and the open page and editor are unchanged

#### Scenario: The row targets its own page

- **GIVEN** page A with a rule and page B open without one
- **WHEN** the user activates the removal item on page A's row menu
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

#### Scenario: A daily rule names its anchor in the item

- **GIVEN** a page whose rule is `daily` anchored on 2026-10-06
- **WHEN** the user opens that page row's menu
- **THEN** the removal item reads `Remove reminder (every day from October 6,
  2026)`

#### Scenario: A one-off rule names its day in the item

- **GIVEN** a page whose rule is `once` anchored on 2026-10-20
- **WHEN** the user opens that page row's menu
- **THEN** the removal item reads `Remove reminder (once, on October 20, 2026)`
