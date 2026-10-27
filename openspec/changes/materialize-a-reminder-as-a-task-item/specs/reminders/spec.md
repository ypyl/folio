# Spec Delta

## MODIFIED Requirements

### Requirement: Opening a day materializes a due reminder

While a journal day is open, the app SHALL write, once, one task item for each
rule that matches the day and whose page the day's note does not already
reference. Each write SHALL add one unchecked task item (`- [ ] `) whose text is
an ADR-0012 reference to the rule's page, so the day holds the occurrence, the
user can tick it, and the reminder page's backlinks list the day. A rule that
does not match the day, or whose page the note already references in any form,
SHALL write nothing, and the app SHALL write only for the day being opened.

#### Scenario: The day gains the line

- **GIVEN** a `daily` rule whose page the open day's note does not reference
- **WHEN** the user opens that day
- **THEN** the day's note gains one line `- [ ] #[[Page]]` for that page and the
  page's backlinks list the day

#### Scenario: The written line can be ticked

- **GIVEN** a day whose note gained the line `- [ ] #[[Take pills]]` on open
- **WHEN** the day is open in the editor
- **THEN** the line renders a checkbox, and ticking it writes `- [x]` to the
  note and clears that reminder from the app-icon badge

#### Scenario: A single-word page is referenced in word form

- **GIVEN** a matching rule whose page name is a single word `reading`
- **WHEN** the user opens that day
- **THEN** the note gains the line `- [ ] #reading`

#### Scenario: Reopening does not repeat the line

- **GIVEN** a day whose note already holds `- [ ] #[[Take pills]]` or a bare
  `#[[Take pills]]` line
- **WHEN** the user opens it again
- **THEN** the note is unchanged and holds one reference to that page

#### Scenario: A rule that does not match writes nothing

- **GIVEN** a `weekly` rule that does not match the open day
- **WHEN** the user opens that day
- **THEN** the day's note is unchanged

#### Scenario: A ticked line keeps its record

- **GIVEN** a day whose note holds `- [x] #[[Take pills]]`
- **WHEN** the user reopens that day
- **THEN** the note is unchanged
