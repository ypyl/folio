# Spec Delta

## Purpose

The record of what an AI agent did to the user's notes on the user's behalf, and
the one surface that shows it. It exists so an agent's change is distinguishable
from the user's own after the fact: which page, which action, and what changed.
It is a log for review, not a ledger and not an undo.

## ADDED Requirements

### Requirement: An action taken on the user's behalf is recorded

When an action is performed on the user's behalf, the app SHALL record one entry
naming the action, the vault path it touched, what changed, and when. Recording
SHALL happen whether or not the path belongs to the page that is open, and SHALL
happen for every such action, not only the ones a surface shows.

#### Scenario: An action on an unopened page is recorded

- **GIVEN** a folder open and the gate on
- **WHEN** an action changes a page that is not open
- **THEN** the record gains an entry naming that page's path

#### Scenario: An action on the open page is recorded

- **GIVEN** a folder open, a page open, and the gate on
- **WHEN** an action changes that page
- **THEN** the record gains an entry naming its path

### Requirement: An entry names the action, the path, and what changed

An entry SHALL carry the action's name, the vault-relative path, the time it
happened, and what changed in counts (the lines added and removed). It SHALL NOT
carry the page's new text.

#### Scenario: An entry reads as an action and its subject

- **GIVEN** the gate on and an action that replaces three lines in a page
- **WHEN** the record gains its entry
- **THEN** the entry names the action, the page's path, the time, and the count
  of lines added and removed

### Requirement: The record carries no page text

The record SHALL contain paths, action names, counts, and times only. It SHALL
NOT contain page or board text, draft content, or any file's bytes, in memory or
in the trace file it mirrors into.

#### Scenario: The durable record holds no page text

- **GIVEN** an action that changed a page's text
- **WHEN** the session's trace file is read
- **THEN** it names the action, the path, and the counts, and holds none of the
  page's text

### Requirement: The record is session-scoped and bounded

The record SHALL cover the current session only, SHALL be discarded when the app
reloads, and SHALL be bounded so a long session's record stays small: past its
cap the oldest entries SHALL be dropped. The record SHALL NOT be written to the
vault beyond the trace file it mirrors into, and the trace file SHALL keep its
own seven-day pruning.

#### Scenario: A reload starts an empty record

- **GIVEN** a session whose record has entries
- **WHEN** the app reloads
- **THEN** the record is empty

#### Scenario: A long session keeps a bounded record

- **GIVEN** more recorded actions than the record's cap
- **WHEN** the record is read
- **THEN** it holds the newest entries up to the cap

### Requirement: The status bar offers the record behind a disclosure

At viewports wider than the compact breakpoint, the status bar SHALL carry one
control that reports whether its panel is open and shows how many actions the
session recorded, and SHALL open, on activation, a panel anchored above the bar's
trailing edge listing the entries newest first. Each row SHALL name the action,
the path, and the time, and activating a row SHALL open the page it names. An
ordinary dismissal SHALL close the panel: a second activation, a pointer press
outside it, `Escape`, or the shell losing focus. Opening or closing the panel
SHALL NOT write to the vault or to any stored preference.

#### Scenario: The entry reports the count and opens the panel

- **GIVEN** the gate on and three recorded actions
- **WHEN** the user activates the status bar's activity control
- **THEN** a panel opens above the bar listing those three entries, newest first

#### Scenario: A row opens its page

- **GIVEN** a panel listing an entry that names a page
- **WHEN** the user activates that row
- **THEN** that page opens

#### Scenario: A dismissal closes the panel

- **GIVEN** the panel open
- **WHEN** the user presses `Escape`, presses outside the panel, or activates the
  control again
- **THEN** the panel closes and the control reports it closed

#### Scenario: The compact shell carries no activity control

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** no activity control and no panel are drawn, and the compact app bar's
  status line is unchanged

### Requirement: Nothing is recorded or shown while the gate is off

While the gate is off, the app SHALL record no entry, SHALL render no activity
control, and SHALL draw no panel. The record's own code, its tests, and its trace
event SHALL remain, so enabling the gate is the whole enable step.

#### Scenario: A gate-off build records nothing

- **GIVEN** the gate off
- **WHEN** the app runs
- **THEN** the record stays empty and the status bar draws no activity control

#### Scenario: Turning the gate off hides what it showed

- **GIVEN** the gate on with recorded entries
- **WHEN** the user turns experimental mode off
- **THEN** the activity control is gone and nothing further is recorded
