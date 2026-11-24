# Changelog

What changed in Folio, newest first, grouped by the version that shipped it.
Generated from the commit history by `npm run changelog`, so an entry exists for
every `feat:` and `fix:` commit and for nothing else. The status bar's version
badge reads this file.

## v0.99.11 (2026-11-24)

- an agent can create the page that is open

## v0.99.10 (2026-11-24)

- a keystroke no longer rebuilds the editor's seed

## v0.99.9 (2026-11-24)

- a save that fails is retried instead of waiting for the next keypress

## v0.99.8 (2026-11-24)

- a page that exists on disk is never opened blank and written over

## v0.99.7 (2026-11-24)

- a dropped file never replaces one that differs only in case

## v0.99.6 (2026-11-24)

- an edit made outside the app is not overwritten

## v0.99.5 (2026-11-24)

- the first press on a diagram opens its source

## v0.99.4 (2026-11-24)

- a reference below a diagram still opens

## v0.99.2 (2026-11-24)

- a start never costs the reader a stored folder

## v0.99.0 (2026-11-24)

- say what the app is loading

## v0.98.4 (2026-11-24)

- a page that opens on a diagram draws it

## v0.98.3 (2026-11-24)

- turning the diagram switch on draws the page already open

## v0.98.2 (2026-11-24)

- deploy Pages from a job after the build

## v0.98.0 (2026-11-24)

- draw a page's mermaid diagrams, in the page and in a presentation

## v0.97.4 (2026-11-23)

- never strand the app on its restoring state

## v0.97.2 (2026-11-22)

- tell a page with no file from a page that cannot be read

## v0.97.0 (2026-11-21)

- let a browser agent act on notes, through the app's own actions

## v0.96.0 (2026-11-21)

- record what an agent did, behind the experimental switch

## v0.95.0 (2026-11-12)

- take the tour inside the guided demo

## v0.94.0 (2026-11-12)

- send feedback from the rail

## v0.93.0 (2026-11-12)

- group the changelog by version

## v0.92.2 (2026-11-12)

- give the installed icon opaque corners

## v0.92.0 (2026-11-11)

- move the Logseq import to a repo script

## v0.91.0 (2026-11-11)

- enlarge the phone's text

## v0.90.0 (2026-11-11)

- give the phone a three-tab navigation bar

## v0.89.0 (2026-11-11)

- give the phone an app-scale design

## v0.88.2 (2026-11-11)

- show the page when its own row is selected

## v0.88.0 (2026-11-11)

- make the app usable on a phone

## v0.87.12 (2026-11-11)

- record the import's source files a batch at a time

## v0.87.10 (2026-11-11)

- walk the folder again when a cached directory handle is stale

## v0.87.9 (2026-11-11)

- normalize a terminal whitespace line to the page's one empty line

## v0.87.7 (2026-11-11)

- never let two flushes write the same page at once

## v0.87.5 (2026-11-11)

- read the folder again after a failed scan

## v0.87.4 (2026-11-11)

- keep a draft dirty when its write carried older text

## v0.87.3 (2026-11-11)

- render a destination the app cannot open as text

## v0.87.0 (2026-11-11)

- show the recent changes from the version badge

## v0.86.0 (2026-11-10)

- ship the session trace in every build

## v0.85.6 (2026-11-10)

- say what the experimental switch turns on

## v0.85.4 (2026-11-10)

- refuse a page name the folder cannot hold

## v0.85.0 (2026-11-06)

- record a session trace in the vault
