# Spec Delta

## MODIFIED Requirements

### Requirement: Contents offers Expand all and Collapse all controls

While the open page has headings, the Contents section's summary row SHALL offer
an Expand all control and a Collapse all control, at its trailing edge ahead of
the section's disclosure marker and in that order; neither SHALL appear anywhere
else. It SHALL offer neither for a page with no heading, while no page is open,
or while the loading placeholder shows, because there is nothing for them to act
on. Activating either control SHALL NOT open or close the Contents section, and
the summary SHALL stay one row tall whether the section is open or collapsed.

#### Scenario: Controls appear with the rows

- **GIVEN** an open page with headings
- **WHEN** the user looks at the Contents section
- **THEN** its summary row offers both an Expand all and a Collapse all control,
  in that order, before the section's disclosure marker

#### Scenario: A control does not toggle the section

- **GIVEN** the Contents section is open
- **WHEN** the user activates Expand all or Collapse all
- **THEN** the section stays open and only that control's effect on the rows runs

#### Scenario: The controls survive a collapsed Contents

- **WHEN** the user collapses the Contents section
- **THEN** Expand all and Collapse all stay on its summary row

#### Scenario: No headings offer no controls

- **GIVEN** an open page with no heading
- **WHEN** the user looks at the Contents section
- **THEN** it shows its empty-state copy and neither control
