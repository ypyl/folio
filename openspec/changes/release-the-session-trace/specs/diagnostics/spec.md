# Spec Delta

## ADDED Requirements

### Requirement: Tracing runs for every real folder

Every build SHALL trace a real folder: opening one SHALL start a session and
write its trace file. Tracing SHALL need no build flag, no environment variable,
and no switch, and the app SHALL offer no control that turns it on or off. A
demo vault SHALL still write no trace, because it has no folder.

#### Scenario: A shipped build traces the folder it opens

- **GIVEN** a real folder with no trace file
- **WHEN** the user opens the folder and edits a page
- **THEN** the folder gains `.folio/logs/` and one trace file recording the
  session and the save

#### Scenario: No switch turns tracing on

- **WHEN** the user looks across the app
- **THEN** there is no control that enables or disables the trace

## MODIFIED Requirements

### Requirement: A session writes one trace file into the folder

With a real folder open, the app SHALL write one trace file to `.folio/logs/` in
that folder, named for the session's start time so the files sort chronologically
and no two names collide. A session SHALL begin when the folder becomes active
and SHALL end when that folder stops being active or the app goes away. A new
session SHALL write a new file and SHALL never append to another session's file.

#### Scenario: A session leaves one trace file

- **GIVEN** a real folder open
- **WHEN** the user opens a page and edits it
- **THEN** `.folio/logs/` holds one trace file for that session

#### Scenario: A folder switch starts a new file

- **GIVEN** a trace file for the open folder
- **WHEN** the user switches to another folder
- **THEN** the first folder's file is finished and the second folder gains its
  own trace file

#### Scenario: A demo vault writes no trace

- **GIVEN** the guided demo open
- **WHEN** the user edits a demo page
- **THEN** no trace file is written, because a demo vault has no real folder

### Requirement: The trace records uncaught errors

The trace SHALL record an error the app did not catch and a promise rejection
nothing handled, with the message and, where the browser gives one, the source
location.

#### Scenario: An uncaught error reaches the trace

- **GIVEN** a real folder open
- **WHEN** the app throws an error that nothing catches
- **THEN** the trace records the error's message and source

### Requirement: Recording never changes what an action does

Recording SHALL be best-effort and off the typing path: lines SHALL be buffered
in memory and written on a short delay, and a keystroke SHALL cause no write. A
failed trace write SHALL leave the action being recorded unchanged, SHALL surface
no error to the user, and SHALL NOT retry in a loop.

#### Scenario: A failing trace write does not fail the save

- **GIVEN** a real folder open whose writes to `.folio/logs/` are rejected
- **WHEN** the user's edit is saved
- **THEN** the page is saved, the editor reports it clean, and no error is shown

#### Scenario: Typing writes no trace line

- **GIVEN** an open page in a real folder
- **WHEN** the user types a character
- **THEN** the app writes nothing to the trace until the save it schedules

## REMOVED Requirements

### Requirement: Tracing is off until the gate is on

**Reason**: The trace ships in every build. With no flag and no experimental
switch, there is no gate to be off, and keeping the requirement would describe a
state the app can no longer enter.

**Migration**: None. A build that set `VITE_TRACE=1` keeps tracing, which is now
what every build does. The `folio.prerelease` browser key is no longer read; a
leftover value is harmless.
