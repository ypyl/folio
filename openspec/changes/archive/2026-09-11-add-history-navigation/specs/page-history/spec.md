## ADDED Requirements

### Requirement: Opening a page appends it to the session trail

The app SHALL record every page it opens in a session trail of page paths in the order they were opened, together with a cursor marking the page that is open. Every route that opens a page SHALL be recorded: a page row, a calendar day, a backlink or forwardlink row, a search result, a reference badge, and the journal day the app opens on its own when a folder's index becomes ready. Recording a page SHALL first discard every entry ahead of the cursor and then append the page, so a new navigation always starts a fresh line ahead. Recording SHALL leave the trail unchanged when the page is the one the cursor already marks, so a repeat of the open page adds no entry. Recording SHALL leave the open page, the folder's index, and the vault's files unchanged: it writes nothing to disk, so opening an unmaterialized page still creates no file.

#### Scenario: Opening pages records where you came from

- **WHEN** the user opens `Alpha.md` and then `Beta.md`
- **THEN** the trail is `Alpha` then `Beta`, and the cursor marks `Beta`

#### Scenario: Every way of opening a page is recorded

- **WHEN** the user opens a page from a page row, a calendar day, a links-pane row, a search result, and a reference badge
- **THEN** each opened page is the trail's last entry in turn

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

### Requirement: Back and Forward controls move through the trail

The app SHALL provide a Back and a Forward control that step the trail's cursor one entry earlier or later and open the page the cursor then marks. Neither control SHALL add an entry to the trail, so stepping never changes the trail's entries or their order. Each control SHALL be unavailable when there is no entry in its direction: Back when the cursor marks the trail's first entry, Forward when it marks the last. Each control SHALL name its action for assistive technology.

#### Scenario: Back returns to the page you came from

- **GIVEN** the user opened `Alpha` and then `Beta`
- **WHEN** the user activates Back
- **THEN** `Alpha` opens and the cursor marks `Alpha`

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

## MODIFIED Requirements

### Requirement: The trail is capped and lives only for the session

The trail SHALL hold at most 20 entries, discarding its oldest entry when a new one would exceed the cap, so the cursor keeps marking the page that is open. A page MAY appear more than once in the trail when the user returns to it, because the trail records the order pages were opened. The trail SHALL exist only in memory for the current session: it SHALL NOT be written to the vault, to browser storage, or to any file, and reloading the app SHALL start with an empty trail.

#### Scenario: The cap drops the oldest entry

- **GIVEN** the trail holds 20 entries with the cursor on the last
- **WHEN** the user opens a 21st page
- **THEN** the trail still holds 20 entries, the new page is last, the cursor marks it, and the entry opened longest ago is gone

#### Scenario: A reload starts empty

- **GIVEN** a session in which the user has opened several pages
- **WHEN** the app reloads
- **THEN** the trail holds nothing and both Back and Forward are unavailable

#### Scenario: Nothing is written anywhere

- **WHEN** the user opens several pages
- **THEN** no history file appears in the vault, no page file is added or changed, and no trail data is written to browser storage

### Requirement: Switching the active folder clears the trail

When the active folder changes, the trail SHALL be cleared, so no page from the previous folder can be reached by Back or Forward and none appears anywhere in the sidebar. The newly active folder's own first open SHALL become the trail's only entry and the cursor's position.

#### Scenario: A folder switch resets the trail

- **GIVEN** a trail holding pages of vault A
- **WHEN** the user activates vault B
- **THEN** the trail holds only vault B's today journal and Back is unavailable

#### Scenario: Returning to a folder does not restore its trail

- **GIVEN** the user navigated in vault A, then switched to vault B
- **WHEN** the user activates vault A again
- **THEN** vault A's earlier pages are absent and its today journal is the trail's only entry

## REMOVED Requirements

### Requirement: Opening a page records it in the session trail

**Reason**: Replaced by "Opening a page appends it to the session trail". A de-duplicated stack cannot support Back and Forward: returning to an earlier page rewrote the trail's order and dropped the position you came from, so there was nothing to step back into. The trail becomes a visit log with a cursor instead, which is what the new requirement describes.

**Migration**: The trigger set is unchanged — every route that opens a page is still recorded — and so is the guarantee that recording writes nothing. What changes is the entry order: a return to an earlier page now appends an entry instead of moving the existing one to the top, and the scenario requiring that move is retired with this requirement. No user data is involved; the trail lives only in memory.

### Requirement: The History section is the sidebar's third section

**Reason**: The section sat below the entire Pages list in a single scrolling sidebar, so at vault scale it could not be reached without scrolling past every page, and the list that buried it was the sidebar's dominant rendering cost. Its job is done better by the Back and Forward controls this change adds to the sidebar's navigation control row.

**Migration**: Nothing to migrate. The trail's entries and their order are preserved exactly as they were; only their presentation changes, from a list in the sidebar to Back and Forward stepping.

### Requirement: History lists where the user has been and returns there

**Reason**: Removed with the section it describes. This change replaces the list with Back and Forward controls and deliberately does not carry the list's deduplicated view forward, because a cursor over a visit log is a different model: entries can repeat, and the position that is current is meaningful rather than excluded.

**Migration**: Nothing to migrate. The behaviour the requirement covered — returning to a page visited earlier — is covered by "Back and Forward controls move through the trail", one step at a time.
