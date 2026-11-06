# diagnostics Specification

## Purpose
A per-session record of what the app did to a vault folder, kept inside it, so a
lost, emptied, or unexpectedly renamed file can be explained after the fact.

## Requirements

### Requirement: A session writes one trace file into the folder

With tracing enabled and a real folder open, the app SHALL write one trace file
to `.folio/logs/` in that folder, named for the session's start time so the files
sort chronologically and no two names collide. A session SHALL begin when the
folder becomes active or tracing turns on, and SHALL end when that folder stops
being active, tracing turns off, or the app goes away. A new session SHALL write
a new file and SHALL never append to another session's file.

#### Scenario: A session leaves one trace file

- **GIVEN** a real folder open and tracing enabled
- **WHEN** the user opens a page and edits it
- **THEN** `.folio/logs/` holds one trace file for that session

#### Scenario: A folder switch starts a new file

- **GIVEN** a trace file for the open folder
- **WHEN** the user switches to another folder
- **THEN** the first folder's file is finished and the second folder gains its
  own trace file

#### Scenario: A demo vault writes no trace

- **GIVEN** tracing enabled and the guided demo open
- **WHEN** the user edits a demo page
- **THEN** no trace file is written, because a demo vault has no real folder

### Requirement: The trace records the session and the folder's scans

The trace SHALL record one line per event, each carrying a timestamp: the
session's start with the app version, the folder's name, and the browser's
identity; the session's end with the reason it ended; and every scan and refresh
with the number of files it read, the number it carried over, and how long it
took. When a refresh observes that a page was added, changed, or vanished outside
the app, the trace SHALL record that page's path and its size before and after.

#### Scenario: An external edit is recorded with its sizes

- **GIVEN** an open folder holding a page of 4123 bytes that an outside tool
  empties
- **WHEN** the window regains focus and the vault refreshes
- **THEN** the trace records that page's path with the size before and after

#### Scenario: A vanished file is recorded

- **GIVEN** an open folder whose page is removed outside the app
- **WHEN** the vault refreshes
- **THEN** the trace records the page's path as vanished

### Requirement: The trace records the app's writes and failures

The trace SHALL record every write the app makes into the folder with the file's
path, its size, and whether it succeeded, every failed read, write, or stat with
the error's name and message, every page opened, every flush with the number of
writes it carried, and every save the app reported as failed.

#### Scenario: A failed write is recorded with its error

- **GIVEN** an open folder and a page whose writes are rejected
- **WHEN** the user's edit is saved and the write fails
- **THEN** the trace records the write, its path and size, and the error

#### Scenario: A flush is recorded

- **GIVEN** an open page with an edit waiting on the save delay
- **WHEN** the tab becomes hidden and the pending write is flushed
- **THEN** the trace records the flush and the number of writes it carried

### Requirement: The trace records uncaught errors

The trace SHALL record an error the app did not catch and a promise rejection
nothing handled, with the message and, where the browser gives one, the source
location.

#### Scenario: An uncaught error reaches the trace

- **GIVEN** tracing enabled and a folder open
- **WHEN** the app throws an error that nothing catches
- **THEN** the trace records the error's message and source

### Requirement: The trace holds no page text

The trace SHALL contain paths, sizes, counts, durations, and error messages only.
It SHALL NOT contain page or board text, unsaved or draft content, typed
characters, search queries, or any file's bytes.

#### Scenario: A saved page contributes no prose

- **GIVEN** a page holding several sentences of the user's writing
- **WHEN** the page is saved and its write is recorded
- **THEN** the trace names the page's path and size and holds none of its text

### Requirement: Tracing is off until the gate is on

Tracing SHALL be enabled only when its build-time flag is on or the app's
experimental switch is on. While it is off, the app SHALL create no log
directory, write no trace file, register no listener that writes, and record
nothing.

#### Scenario: The shipped build writes no trace

- **GIVEN** the build flag off and the switch off
- **WHEN** the user opens a folder, edits a page, and saves it
- **THEN** the vault gains no `.folio/logs/` directory and no trace file

#### Scenario: The switch turns tracing on for the session

- **GIVEN** the build flag off, the switch off, and a folder open
- **WHEN** the user turns the experimental switch on and edits a page
- **THEN** a trace file appears for the remainder of the session and records the
  edit and its save

### Requirement: Recording never changes what an action does

Recording SHALL be best-effort and off the typing path: lines SHALL be buffered
in memory and written on a short delay, and a keystroke SHALL cause no write. A
failed trace write SHALL leave the action being recorded unchanged, SHALL surface
no error to the user, and SHALL NOT retry in a loop.

#### Scenario: A failing trace write does not fail the save

- **GIVEN** tracing enabled and a folder whose writes to `.folio/logs/` are
  rejected
- **WHEN** the user's edit is saved
- **THEN** the page is saved, the editor reports it clean, and no error is shown

#### Scenario: Typing writes no trace line

- **GIVEN** an open page and tracing enabled
- **WHEN** the user types a character
- **THEN** the app writes nothing to the trace until the save it schedules

### Requirement: Trace files older than seven days are pruned

At the start of a session, the app SHALL remove the trace files in
`.folio/logs/` whose name dates them more than seven days before the session's
start. It SHALL remove only files named as its own trace files, and SHALL leave
every other file in the folder, that directory included, alone.

#### Scenario: An old trace is removed at session start

- **GIVEN** `logs` holding a trace file dated eight days ago and one dated six
  days ago
- **WHEN** a session starts
- **THEN** the eight-day-old file is gone and the six-day-old file remains

#### Scenario: A file the app did not name is untouched

- **GIVEN** `.folio/logs/` holding a file whose name is not a trace file's
- **WHEN** a session starts
- **THEN** that file remains

### Requirement: The app removes only its own trace files

Removing SHALL be available to the trace's pruner and to nothing else: the app
SHALL never remove a page, a journal day, a board, a file, a pin, or a reminder
rule.

#### Scenario: Pruning leaves the folder's own files intact

- **GIVEN** a folder holding pages, a board, a pin, and a reminder rule
- **WHEN** a session starts and prunes an old trace
- **THEN** every page, the board, the pins file, and the rules file are unchanged
