# Spec Delta

## ADDED Requirements

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
