# Spec Delta

## MODIFIED Requirements

### Requirement: The right panel is an accordion of page metadata

The right panel SHALL hold the page sections Contents and Links, followed by the
shortcuts reference as the last section. Contents and Links SHALL both be open
by default and SHALL open and close independently. While no page and no board is
open, each SHALL show placeholder copy; while a board is open, the panel SHALL
show the board's Referenced by section instead of the page sections. The Links
section SHALL take the remaining height, scrolling within itself and keeping a
minimum height; Contents SHALL size to its content up to a maximum, except that
when Links is collapsed Contents SHALL take the space it gave up. A collapsed
section SHALL sit at the panel's bottom.

When a page is open, each section SHALL list its rows. Contents SHALL list the
page's headings as an indented tree with a disclosure control on every heading
that has a subtree. Links SHALL list, in one list, the pages that reference the
open page, most recently edited first, then the pages the open page references in
document order, then the files it points at in their order, then the boards it
references in theirs. Every row SHALL carry a badge before its label: `in` for a
backlink, `out` for a forwardlink, `a` for a file, `b` for a board. A section
with no rows SHALL show empty-state copy. Page rows that name a page with no file
SHALL be dimmed but stay clickable; file rows SHALL NOT be dimmed.

#### Scenario: Meta sections are independently collapsible

- **WHEN** the user collapses Links while Contents is open
- **THEN** Links collapses and Contents stays open

#### Scenario: Backlinks list the referrers

- **GIVEN** an open page referenced by two pages, one edited more recently
- **WHEN** the user looks at Links
- **THEN** it lists both, most recently edited first, each badged `in`

#### Scenario: Forwardlinks list the targets in reference order

- **GIVEN** an open page referencing several pages
- **WHEN** the user looks at Links
- **THEN** it lists them in the order the references appear, each badged `out`

#### Scenario: Files follow the page references

- **GIVEN** an open page that references pages and links a file
- **WHEN** the user looks at Links
- **THEN** the page rows come first, then the file row, each with its badge

#### Scenario: Empty sections show copy

- **GIVEN** an open page that nothing references and that references nothing
- **WHEN** the user looks at Links
- **THEN** it shows empty-state copy and no rows

#### Scenario: A page with no file is dimmed but clickable

- **GIVEN** an open page referencing a page with no file
- **WHEN** the user looks at Links
- **THEN** the row is dimmed, still clickable, and still opens the page

#### Scenario: A long section scrolls inside itself

- **GIVEN** an open page with more rows than the panel can show
- **WHEN** the user scrolls the section
- **THEN** only that section's body scrolls and the panel itself does not

#### Scenario: A collapsed section is one row

- **WHEN** the user collapses Links
- **THEN** it occupies exactly its summary row, sitting at the panel's bottom,
  and Contents takes the height it gave up

#### Scenario: A journal day shows its reminders

- **GIVEN** an open journal day that matches a reminder rule
- **WHEN** the user looks at the open day
- **THEN** the day's note holds the reminder's reference line and the right panel
  holds no Reminders section

#### Scenario: A page that is not a journal day has no Reminders section

- **GIVEN** an open page that is not a journal day
- **WHEN** the user looks at the right panel
- **THEN** the panel holds Contents and Links but no Reminders section

#### Scenario: A board shows Referenced by, not Reminders

- **GIVEN** an open board
- **WHEN** the user looks at the right panel
- **THEN** the panel shows the board's Referenced by section and no Reminders
  section
