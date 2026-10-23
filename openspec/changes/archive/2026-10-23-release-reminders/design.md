# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `features.reminders` (from `VITE_REMINDERS`) is read in one place, App's
  `remindersEnabled = features.reminders || prerelease`, and gates four things:
  the day menu (through `Sidebar`), the row removal item, the badge, and
  materialization.
- `appendMarkdown` is the only writer of app-authored text into a user's
  document, and its only caller is materialization. It dispatches at the document
  end with `selection` moved to the insertion point and `scrollIntoView: true`.
  It has no direct test: the App tests use the fake editor and the e2e asserts the
  text, not the view.
- Page rows already carry a kind badge (`b`/`a`) in `--warm-sand` on `--stone`,
  `aria-hidden`, and are otherwise plain buttons whose accessible name is the
  label. App already memoizes `reminderRules`, a `ReadonlyMap` from lowercased
  page name to the rule, for the row menu.
- The rail's bottom group holds the prerelease toggle before the tour control.
  Prerelease state is one `localStorage` key read by `usePrerelease`.

## Goals / Non-Goals

**Goals:**

- Promote the feature with no behavioural change beyond the two fixes.
- Make the promotion legible in the code: no gate left to flip, nothing dead.
- Keep the keystroke path untouched: one map lookup per row, no per-keystroke
  rebuild.

**Non-Goals:**

- No rule-format change, no new recurrence, no scheduler.
- No new tab-stop or control on the row; the marker is not interactive.
- No compatibility shim for the retired preference key.

## Decisions

### D1: Delete the gate, rather than flip it to a constant

`features.ts` and `remindersEnabled` are removed and the four call sites read as
plain conditions (`journalDay !== null`, `reminderTarget !== null`, and so on),
so there is no `true` constant that invites a second flag later. The engine and
the seams stay: the parser, the matcher, and the `.folio/reminders.md`
read/write path are unchanged, which is what the flag change promised.

Alternative rejected: `reminders: true` in `features.ts`. It keeps a gate that
can only ever be on, and a dead constant is what made the prerelease toggle
inoperable.

### D2: The append is view-neutral

`appendMarkdown` inserts at the document end and leaves the selection and the
scroll position alone: no `selection` in the dispatch and no `scrollIntoView`.
CodeMirror maps the existing selection through the insertion, and because the
insertion is at the end, a caret anywhere earlier does not move.

The line is still an ordinary edit: it goes through `onChange`, marks the draft
dirty, and the normal delayed save persists it, so an occurrence can be undone
and is saved exactly like a typed line.

Alternative rejected: scroll to the line so the user sees what was added. It
reads as a bug on a long note (the note opens at the bottom), and the add is not
worth the hijack. The row marker (D3) is where "something is due" belongs.

### D3: The marker is a badge on the page row

`Sidebar` renders a reminder marker for a page row whose label is in
`reminderRules` — the map already built for the row menu, so one `has` lookup and
no new derived data. It reuses the kind badge's treatment (16px, `--warm-sand`,
`--stone`, a 10px glyph) so the row's two facts, kind and reminder, read as one
system and no second chromatic colour appears (Kami rule, DESIGN.md).

The glyph is `aria-hidden` decoration, like `b`/`a`, and the row's accessible
name stays the page's name: the same fact is already exposed to assistive
technology by the row's `Remove reminder` item, labelled with the schedule it
deletes. Renaming rows that have a reminder was rejected: it changes the name of
a row depending on unrelated state, and it would churn every test and the e2e
queries that name a row.

### D4: Prerelease mode retires with the flag

The mode's only job is to turn on flagged features. With the last flag released
the control cannot change anything, so the toggle, the preference, and the spec
go. `FolderRail`'s bottom group keeps the tour control, which the workspace spec
already requires to be the rail's last control.

Alternative rejected: keep the mechanism with the toggle hidden while no feature
is flagged. It leaves an unread preference, an unused hook, and a spec describing
a control no one can see.

### D5: The e2e stops forcing the flag

`playwright.config.ts` drops `VITE_REMINDERS` so the e2e exercises the build a
user gets, and `tests/e2e/reminders.spec.ts` becomes an assertion about the
shipped app rather than about a flagged one.

## Risks / Trade-offs

- [A materialized line is now silent] → The row marker says a page has a
  reminder, the note's badge renders it once the editor draws the line, and the
  app-icon badge counts the day. Nothing is lost that the scroll-jump showed.
- [Opening a due day still writes the file] → Unchanged and intended (ADR-0032):
  the day's note is the occurrence's record. The write is now the only effect.
- [`appendMarkdown` losing its selection move] → No other caller exists, so
  nothing depends on it; the new test pins the contract.
- [Deleting prerelease mode removes a built mechanism] → It is one commit of
  history away, and re-adding it with a future flag is smaller than keeping a
  preference store and a spec that gate nothing.
- [The marker costs a row a few pixels] → The badge is `flex: 0 0 auto` at 16px
  and the label truncates, the same trade the kind badge already makes.
