## MODIFIED Requirements

### Requirement: A page's files are listed in the Forwardlinks Files group

When a page is open, the Forwardlinks section's Files group SHALL list one row per asset the page references, labelled with the file's name and listed in the order the references appear in the page, and never dimmed or marked as the open page. The Files group SHALL be the only panel list holding asset rows: a page's assets SHALL NOT appear in the Forwardlinks Pages group. Board references share the same group (whiteboards capability). Activating an asset row SHALL open the file (see "Activating an asset opens the file and changes nothing else"). While the index builds, the group SHALL show the shell's loading placeholders, and when the open page references no asset it SHALL show empty-state copy.

#### Scenario: A page's files appear in the References section

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** its Files group lists a `q3-report.pdf` row, and its Pages group holds no asset row

#### Scenario: A page's files are not page rows

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the Forwardlinks Pages group
- **THEN** it lists only the `Roadmap` row

#### Scenario: An asset row opens instead of navigating

- **GIVEN** an open page whose Forwardlinks Files group lists `q3-report.pdf`
- **WHEN** the user activates that row
- **THEN** the file opens, and the editor keeps showing the same page with the same active marking

#### Scenario: A page with no assets shows copy

- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user opens the Forwardlinks Files group
- **THEN** it shows empty-state copy and no rows
