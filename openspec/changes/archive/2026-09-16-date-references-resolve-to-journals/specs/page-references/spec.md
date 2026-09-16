## ADDED Requirements

### Requirement: A date-shaped name names the journal day
A reference whose name is a valid calendar date in zero-padded `YYYY-MM-DD` form SHALL name the journal day for that date and resolve to the path `journals/<date>.md`, whether or not that file exists on disk. The app SHALL NOT resolve such a name to a page under `pages/`. Both lexical forms SHALL follow this rule. A name that is not a valid calendar date SHALL keep the ordinary resolution rule: the page whose filename stem matches, otherwise a blank page under `pages/`.

#### Scenario: A date reference targets the journal day with no file yet
- **GIVEN** a vault with no `journals/2026-09-16.md`
- **WHEN** a note contains `#[[2026-09-16]]`
- **THEN** the reference names the journal day for 2026-09-16, whose path is `journals/2026-09-16.md`, and no page under `pages/` is created or opened for it

#### Scenario: The word form follows the same rule
- **WHEN** a note contains `#2026-09-16`
- **THEN** it names the same journal day as `#[[2026-09-16]]`, resolving to `journals/2026-09-16.md`

#### Scenario: An existing journal file is the target
- **GIVEN** a vault containing `journals/2026-09-16.md`
- **WHEN** a note contains `#[[2026-09-16]]`
- **THEN** the reference resolves to `journals/2026-09-16.md`

#### Scenario: A date reference stays a valid reference with no page
- **GIVEN** a vault with no journal file for 2026-09-16
- **WHEN** a note contains `#[[2026-09-16]]` and is saved
- **THEN** the reference is recorded as valid, and the vault gains no file for that day

#### Scenario: A name that is not a real date is a page
- **WHEN** a note contains `#[[2026-13-45]]`
- **THEN** it resolves to the page `2026-13-45` and materializes under `pages/` on first save

#### Scenario: An unpadded date is a page
- **WHEN** a note contains `#[[2026-9-6]]`
- **THEN** it resolves to the page `2026-9-6` and materializes under `pages/` on first save

#### Scenario: Backlinks reach a day with no file
- **WHEN** a note containing `#[[2026-09-16]]` is saved, and no journal file exists for that day
- **THEN** the open journal day for 2026-09-16 lists that note in its Backlinks
