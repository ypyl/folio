# Changelog

What changed in Folio, newest first. Generated from the commit history by
`npm run changelog`, so an entry exists for every `feat:` and `fix:` commit
and for nothing else. The status bar's version badge reads this file.

## 2026-11-11

- walk the folder again when a cached directory handle is stale
- normalize a terminal whitespace line to the page's one empty line
- never let two flushes write the same page at once
- read the folder again after a failed scan
- keep a draft dirty when its write carried older text
- render a destination the app cannot open as text
- show the recent changes from the version badge

## 2026-11-10

- ship the session trace in every build
- say what the experimental switch turns on
- refuse a page name the folder cannot hold

## 2026-11-06

- record a session trace in the vault

## 2026-11-04

- carry a missed one-off to today and retire it when ticked
- put Contents' expand and collapse all on its summary row

## 2026-11-03

- lead every accordion summary with its disclosure marker
- restore the sidebar's column layout
- even out the status bar's insets
- put the session navigation on the Journal row
- put the session navigation under the journal calendar

## 2026-10-29

- search by exact case with a match-case toggle

## 2026-10-27

- make the brand screen scannable
- enable presenting with a shared Markdown renderer
- make the browser requirement a visible warning
- keep the demo's session-only notice in view
- drop an unused import from the demo storage
- open a guided demo vault with a table of contents
- expand or collapse every Contents subtree at once
- write a due reminder as a task item so it can be ticked
- attach dropped files instead of inserting their text
- refresh the index on return, not on a timer
- import a date-named page as its journal day
- download an SVG instead of opening it as a document
- add a folder even when a stored handle cannot be compared
- keep dropped links in the order the files landed
- stop a reopened day from adding the reminder line twice
- close a code fence on a longer run and read tilde fences
- open the app when the folder registry cannot be read
- keep a pending write in its own folder across a switch
- open the vault past a page the scan cannot read
- drop a board read that lands after another board opened
- stop counting a ticked reminder
