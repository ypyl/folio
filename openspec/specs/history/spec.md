# Back and forward

## Purpose

Let a user return to recently opened pages and boards. Every surface the app
opens is remembered for the session as a trail, so following a link is no longer
a one-way trip.

## Requirements

### Requirement: Opening a page or board appends it to the session trail

The app SHALL record every page and board it opens in a session trail, in the
order they were opened, with a cursor marking the entry that is open. Every way
of opening SHALL be recorded: a page row, a calendar day, a backlink or
forwardlink row, a search result, a reference badge, a board badge, a board row,
and the journal day the app opens by itself when a folder opens. A new
navigation SHALL first discard every entry ahead of the cursor and then append,
so it always starts a fresh line ahead. Recording the entry the cursor already
marks SHALL leave the trail unchanged. Recording SHALL write nothing: opening a
page with no file, or a board with no file, still creates no file.

#### Scenario: Opening pages records where you came from

- **WHEN** the user opens Alpha and then Beta
- **THEN** the trail is Alpha then Beta, with the cursor on Beta

#### Scenario: Every way of opening is recorded

- **WHEN** the user opens pages from a row, a calendar day, a link row, a search
  result, and a reference badge
- **THEN** each opened page is the trail's last entry in turn

#### Scenario: Every way of opening a board is recorded

- **WHEN** the user opens boards from a board badge, a board row, a path link,
  and a board search result
- **THEN** each opened board is the trail's last entry in turn

#### Scenario: The app's own journal open is recorded

- **WHEN** the app opens a folder's today journal on its own
- **THEN** that journal is the trail's last entry

#### Scenario: Returning to an earlier page appends instead of reordering

- **GIVEN** the trail is Alpha then Beta, with the cursor on Beta
- **WHEN** the user opens Alpha again
- **THEN** the trail is Alpha, Beta, Alpha with the cursor on the last entry,
  and Beta remains one Back away

#### Scenario: A new navigation discards what was ahead

- **GIVEN** the trail is Alpha, Beta, Gamma and the user has stepped Back to Beta
- **WHEN** the user opens Delta
- **THEN** the trail is Alpha, Beta, Delta and Gamma is no longer reachable by
  Forward

#### Scenario: Opening the entry already open adds nothing

- **GIVEN** Alpha is open and the cursor marks it
- **WHEN** the user opens Alpha again
- **THEN** the trail is unchanged

#### Scenario: Recording creates no file

- **WHEN** the user opens a page or board with no file and then another entry
- **THEN** no file is created and no vault file changes

### Requirement: The trail is capped and lives only for the session

The trail SHALL hold at most 20 entries, discarding its oldest entry when a new
one would exceed the cap. A page MAY appear more than once when the user returns
to it. The trail SHALL exist only for the current session: it SHALL NOT be
written to the vault or to any browser storage, and reloading the app SHALL
start with an empty trail.

#### Scenario: The cap drops the oldest entry

- **GIVEN** the trail holds 20 entries with the cursor on the last
- **WHEN** the user opens a 21st
- **THEN** the trail still holds 20 entries, the new entry is last, and the
  oldest is gone

#### Scenario: A reload starts empty

- **GIVEN** a session in which the user has opened several entries
- **WHEN** the app reloads
- **THEN** the trail holds nothing and both Back and Forward are unavailable

#### Scenario: Nothing is written anywhere

- **WHEN** the user opens several entries
- **THEN** no file is added or changed and no trail data is written to browser
  storage

### Requirement: Switching the active folder clears the trail

When the active folder changes, the trail SHALL be cleared, so no entry from the
previous folder can be reached by Back or Forward. The newly active folder's own
first open SHALL become the trail's only entry.

#### Scenario: A folder switch resets the trail

- **GIVEN** a trail holding entries of vault A
- **WHEN** the user activates vault B
- **THEN** the trail holds only vault B's today journal and Back is unavailable

#### Scenario: Returning to a folder does not restore its trail

- **GIVEN** the user navigated in vault A, then switched to vault B
- **WHEN** the user activates vault A again
- **THEN** vault A's earlier entries are absent and its today journal is the
  trail's only entry

### Requirement: Back and Forward controls move through the trail

The app SHALL provide a Back and a Forward control that step the cursor one
entry earlier or later and open the page or board it then marks. Neither control
SHALL add an entry. Each SHALL be unavailable when there is no entry in its
direction, and each SHALL name its action for assistive technology.

#### Scenario: Back returns to where you came from

- **GIVEN** the user opened Alpha and then Beta
- **WHEN** the user activates Back
- **THEN** Alpha opens and the cursor marks Alpha

#### Scenario: Back returns to a board's page

- **GIVEN** the user opened a page and then a board
- **WHEN** the user activates Back
- **THEN** the page opens, the board leaves the main pane, and the cursor marks
  the page

#### Scenario: Forward returns to what you backed out of

- **GIVEN** the trail is Alpha, Beta with the cursor on Alpha after Back
- **WHEN** the user activates Forward
- **THEN** Beta opens and the cursor marks Beta

#### Scenario: Stepping does not add entries

- **GIVEN** the trail is exactly Alpha, Beta with the cursor on Beta
- **WHEN** the user activates Back and then Forward
- **THEN** the trail is still exactly Alpha, Beta

#### Scenario: The controls report when there is nowhere to go

- **GIVEN** the trail holds only the entry that is open
- **WHEN** the workspace renders
- **THEN** both Back and Forward are unavailable

#### Scenario: Each control names its action

- **WHEN** the workspace renders
- **THEN** each control is reachable by an accessible name reading "Back" or
  "Forward"

### Requirement: The trail is navigable from the keyboard

While a vault is open the app SHALL bind `Mod+[` to Back and `Mod+]` to Forward
on the session history trail, where `Mod` is the platform's primary modifier
(`Ctrl` on Windows and Linux, `Cmd` on macOS). Each binding SHALL be the same
action the status bar's Back and Forward controls perform: the cursor SHALL move
one entry, the page or board the cursor then marks SHALL open, and no entry
SHALL be added. The chords SHALL act wherever focus is, including inside the
editor, and SHALL supersede the editor's own binding for those two
combinations, so list indentation is reached with `Tab` and `Shift+Tab` alone.
When the trail has nowhere to step in the chord's direction the chord SHALL do
nothing and SHALL NOT fall through to any other action, like the corresponding
control being disabled. With no vault open the app SHALL NOT claim either chord,
leaving the landing screen's chords to the browser.

#### Scenario: The previous entry opens from the keyboard

- **GIVEN** the user has opened Alpha and then Beta
- **WHEN** the user presses the Back chord
- **THEN** Alpha opens and the cursor marks Alpha

#### Scenario: The next entry opens from the keyboard

- **GIVEN** the trail is Alpha, Beta with the cursor on Alpha after Back
- **WHEN** the user presses the Forward chord
- **THEN** Beta opens and the cursor marks Beta

#### Scenario: The chords work with the caret in the editor

- **GIVEN** a page is open with the caret in the editor and an entry to step to
- **WHEN** the user presses the Back chord
- **THEN** the previous entry opens and the editor's own binding for that
  combination does not act

#### Scenario: At the trail's ends the chord does nothing

- **GIVEN** the trail holds only the open entry
- **WHEN** the user presses the Back chord and then the Forward chord
- **THEN** the open page and its text are unchanged and no other action runs

#### Scenario: Stepping by keyboard adds no entry

- **GIVEN** the trail is exactly Alpha, Beta with the cursor on Beta
- **WHEN** the user presses the Back chord and then the Forward chord
- **THEN** the trail is still exactly Alpha, Beta

#### Scenario: The landing screen leaves the chords to the browser

- **GIVEN** no vault is open
- **WHEN** the user presses the Back chord
- **THEN** the app performs no history step
