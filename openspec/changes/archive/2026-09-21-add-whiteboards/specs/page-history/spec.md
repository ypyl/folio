## MODIFIED Requirements

### Requirement: Opening a page appends it to the session trail

The app SHALL record every page and every board it opens in a session trail of entries — each entry a page path or a board path — in the order they were opened, together with a cursor marking the entry that is open. Every route that opens a page SHALL be recorded: a page row, a calendar day, a backlink or forwardlink row, a search result, a reference badge, and the journal day the app opens on its own when a folder's index becomes ready. Every route that opens a board SHALL be recorded: a board-reference badge, a sidebar Boards row, an ordinary Markdown link to a board's path, and a board search result. Recording an entry SHALL first discard every entry ahead of the cursor and then append the entry, so a new navigation always starts a fresh line ahead. Recording SHALL leave the trail unchanged when the entry is the one the cursor already marks, so a repeat of the open page or board adds no entry. Recording SHALL leave the open page or board, the folder's index, and the vault's files unchanged: it writes nothing to disk, so opening an unmaterialized page or a board with no file yet still creates no file.

#### Scenario: Opening pages records where you came from

- **WHEN** the user opens `Alpha.md` and then `Beta.md`
- **THEN** the trail is `Alpha` then `Beta`, and the cursor marks `Beta`

#### Scenario: Every way of opening a page is recorded

- **WHEN** the user opens a page from a page row, a calendar day, a links-pane row, a search result, and a reference badge
- **THEN** each opened page is the trail's last entry in turn

#### Scenario: Every way of opening a board is recorded

- **WHEN** the user opens a board from a board-reference badge, a Boards row, a path link, and a board search result
- **THEN** each opened board is the trail's last entry in turn

#### Scenario: The app's own journal open is recorded

- **GIVEN** a folder whose index has just become ready
- **WHEN** the app opens that folder's today journal
- **THEN** the today journal is the trail's last entry and the cursor marks it

#### Scenario: Returning to an earlier page appends instead of reordering

- **GIVEN** the trail is `Alpha` then `Beta`, and the cursor marks `Beta`
- **WHEN** the user opens `Alpha` again
- **THEN** the trail is `Alpha`, `Beta`, `Alpha` with the cursor on the last entry, and `Beta` remains one Back away

#### Scenario: A new navigation discards what was ahead

- **GIVEN** the trail is `Alpha`, `Beta`, `Gamma` and the user has stepped Back to `Beta`
- **WHEN** the user opens `Delta`
- **THEN** the trail is `Alpha`, `Beta`, `Delta` and `Gamma` is no longer reachable by Forward

#### Scenario: Opening the page already open adds nothing

- **GIVEN** `Alpha` is the open page and the cursor marks it
- **WHEN** the user selects `Alpha` again
- **THEN** the trail is unchanged

#### Scenario: Recording creates no file

- **WHEN** the user opens an unmaterialized page and then another page
- **THEN** no file is created for the unmaterialized page and no vault file changes

#### Scenario: Opening a board with no file yet creates no file

- **WHEN** the user opens a board whose file does not exist yet and then opens another entry
- **THEN** no board file is created and no vault file changes

### Requirement: Back and Forward controls move through the trail

The app SHALL provide a Back and a Forward control that step the trail's cursor one entry earlier or later and open the page or board the cursor then marks. Neither control SHALL add an entry to the trail, so stepping never changes the trail's entries or their order. Each control SHALL be unavailable when there is no entry in its direction: Back when the cursor marks the trail's first entry, Forward when it marks the last. Each control SHALL name its action for assistive technology.

#### Scenario: Back returns to the page you came from

- **GIVEN** the user opened `Alpha` and then `Beta`
- **WHEN** the user activates Back
- **THEN** `Alpha` opens and the cursor marks `Alpha`

#### Scenario: Back returns to a board you came from

- **GIVEN** the user opened a page and then a board
- **WHEN** the user activates Back
- **THEN** the page opens, the board leaves the main pane, and the cursor marks the page

#### Scenario: Forward returns to the page you backed out of

- **GIVEN** the trail is `Alpha`, `Beta` with the cursor on `Alpha` after Back
- **WHEN** the user activates Forward
- **THEN** `Beta` opens and the cursor marks `Beta`

#### Scenario: Stepping does not add entries

- **GIVEN** the trail is exactly `Alpha`, `Beta` with the cursor on `Beta`
- **WHEN** the user activates Back and then Forward
- **THEN** the trail is still exactly `Alpha`, `Beta`, with a single entry for each

#### Scenario: The controls report when there is nowhere to go

- **GIVEN** the trail holds only the page that is open
- **WHEN** the shell renders
- **THEN** both Back and Forward are unavailable

#### Scenario: A new navigation makes Forward unavailable

- **GIVEN** the user stepped Back from `Beta` to `Alpha`
- **WHEN** the user opens `Gamma`
- **THEN** `Beta` is no longer reachable and Forward is unavailable

#### Scenario: Each control names its action

- **WHEN** the shell renders
- **THEN** each control is reachable by an accessible name reading "Back" or "Forward"
