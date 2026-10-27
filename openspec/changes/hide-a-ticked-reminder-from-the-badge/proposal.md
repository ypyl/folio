# Proposal

## Why

The app-icon badge counts every rule that matches the open journal day, so a
reminder the user has already dealt with keeps nagging: a day whose note holds
`- [x] #[[Take pills]]` still shows a badge for `Take pills`. Since ADR-0033 a
task item is a checkbox, and a tick is the app's one gesture for "this is
done", so a ticked reminder line is the record that the user acted on it. The
badge should agree with the user's own note instead of counting the rule again.

## What Changes

- **A ticked reminder line stops counting.** A rule that matches the open day
  is left out of the badge count when that day's note holds a done task item
  (`- [x] …`) that references the rule's page. The badge then shows only what
  still wants attention.
- **Only a done task item counts.** An unticked item (`- [ ] …`), a bare
  reference line, and a reference in prose are not a record of action, so the
  rule keeps counting for them.
- **Nothing else changes.** The rule stays in `.folio/reminders.md`, the page
  still has its backlinks, and materialization is untouched: a ticked line
  already references the page, so reopening the day writes nothing.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the badge counts the open day's rules that the day's note has
  not recorded as done, not every matching rule.

## Non-goals

- No task index, no counts of tasks, no filtering or "done" state of its own.
  The tick is a character in the file, and this change reads it; nothing caches
  it.
- No change to what a day materializes, to the rule file, or to the reminder
  marker on a page row. A reminder whose ticked line exists is still a live
  reminder on later days.
- No change to when the badge is set: it still counts only the open journal
  day, written or not.
- No un-ticking gesture beyond the editor's own checkbox, and no "dismiss"
  action in the app chrome.

## Impact

- `src/vault/reminders.ts`: a pure reader for the done task items in a note's
  text, beside the existing rule parser.
- `src/App.tsx`: the badge count subtracts the rules the open day's note
  records as done, memoized on the day page's identity so nothing rescans per
  keystroke.
- `adr/0032-a-due-reminder-is-written-on-open.md`: its badge sentence gains the
  done-item exception (no new ADR: the decision is a refinement of that one).
- Tests: `src/vault/reminders.test.ts` for the reader, and the App integration
  suite for the badge end to end.
- Version bump: a minor bump (user-facing behavior); the archive commit carries
  its own patch bump.
