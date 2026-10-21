# Proposal

## Why

The status bar shows the open item's path, and for a page its name is a control
that reveals the page's row in the Files listing. For the open journal day the
name is inert text, even though the day has a place of its own in the navigation:
its cell in the Journal calendar. When the calendar has been browsed to another
month, or the Journal section is collapsed, or the left navigation is folded,
nothing on screen connects the open day to its cell, and the only way back is to
hunt for the month by hand.

## What Changes

- **The status bar's file-name crumb becomes a control for a journal day.** The
  crumb text stays the file name, the same crumb the bar already shows; only its
  interactivity changes.
- **Activating it locates the open day in the Journal calendar**: the left
  navigation is shown (unfolded where the three-pane shell folds it, and the
  navigation view where the compact shell shows one view at a time), the Journal
  section opens if it is collapsed, the calendar moves to the day's month, the
  day's cell is scrolled into view, and keyboard focus moves to that cell.
- **Locating a day navigates nowhere and writes nothing.** It does not open a
  different day, change the open page or its content, move the trail, reorder the
  listing, or write to the vault.
- **Its accessible name names the day and the action**, the way the page name
  names the page and the Files listing.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `workspace`: the status bar's page-name requirement grows a journal-day case,
  so the crumb is a control for a page **or** a journal day, and its "a journal
  day's breadcrumb is not a control" scenario is replaced by the day's own
  locate scenarios. The requirement is replaced by one named for what the crumb
  locates, because it no longer speaks only about the Files listing; the page
  behavior and its scenarios carry over unchanged.

## Non-goals

- No new control anywhere else: a journal day in the sidebar, a search row, and
  a links row keep their current behavior, and no keyboard shortcut is added.
- No change to the page-name reveal, including creating a page that has no file.
- No change to the calendar's own rules: chevrons still browse without opening a
  day, opening a day still re-anchors the grid, and the Today control still
  re-anchors to the current month.
- No click behavior change on a day cell: it still opens that day.
- No pretty-date label on the crumb. Every kind of crumb shows the file name, and
  a journal day keeps that.
- No materialization: a day with no note is located in the calendar, not created.

## Impact

- `src/App.tsx`: the pending-reveal path becomes a small pending action, so a
  journal day's locate waits for the left navigation the same way the page
  reveal does.
- `src/components/StatusBar.tsx`: the crumb is a control for a journal day too,
  with its own accessible name.
- `src/components/Sidebar.tsx`: forwards a locate request to the calendar and
  opens the Journal section when it is collapsed.
- `src/components/JournalCalendar.tsx`: re-anchors the shown month to the
  requested day and focuses its cell; a day cell carries its date.
- Tests: status-bar tests for the journal crumb's control and name, calendar and
  sidebar tests for the re-anchor and focus, an App test for the folded and
  compact paths, and an e2e that browses to another month, activates the crumb,
  and finds focus on the day.
- Version bump: minor (a journal day's name becomes a working control).
