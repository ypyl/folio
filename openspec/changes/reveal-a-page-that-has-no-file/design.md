# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `StatusBar` renders the page name as a button only when App passes
  `onRevealPage`; App gates that on `sidebarRows.some(row => row.kind === 'page'
  && row.path === activePath)`, so a page with no file gets no control.
- A reference to a missing page resolves to `pages/<name>.md` and opens a blank
  in-memory draft; the file is created by the first save (`upsertPage` through
  the debounced saver).
- `Sidebar.revealActive` reads the DOM the listing already renders
  (`[data-active]`), opens its section, scrolls, and focuses. It needs the row to
  exist.
- App already owns a `pendingReveal` ref that defers a reveal until a folded pane
  or the compact view has committed; that is exactly the "wait until the row can
  be focused" mechanism the new write needs too.

## Goals / Non-Goals

**Goals:**

- One explicit action turns a brand-new page into a real one, with no new
  surfaces, no draft rows, and no change to what reference-following does.
- The reveal still writes nothing for a page that has a file.

**Non-Goals:**

- No draft rows in the listing; no change to favorites, reminders, or search.
- No reveal for boards, assets, or journal days.

## Decisions

### D1: The reveal creates the page instead of the listing faking a row

A Files row exists for a page backed by a file, and the listing, favorites,
reminders, and search all read that same index. Giving the listing a row for a
page with no file would mean four surfaces learning about rows that are not
files. Writing the page is one call to the existing `savePage` with the content
the editor already holds, after which every surface agrees by itself.

Alternative rejected: materialize on open. Following a reference to check whether
a page exists would then always create a file, which the reference-badge rule
deliberately avoids.

### D2: Two predicates, one for the control and one for the work

`canRevealPage` becomes "the open item is a page" and decides whether the crumb is
a button. `hasPageRow` is the old predicate and decides whether the reveal has to
write first. Keeping them separate is what lets the control appear before the row
exists without making a page with a file pay for a check it never needs.

### D3: The write precedes the reveal, and the reveal waits for the row

`handleRevealPage` sets `pendingReveal`, writes the page when `hasPageRow` is
false, then applies the fold/compact steps. If the row already exists it reveals
immediately; otherwise the existing `pendingReveal` effect fires when `hasPageRow`
flips, which is the render after the write lands. The reveal therefore never
looks for a row that is not there yet, and `revealActive` stays a pure view
operation.

### D4: The created file holds what the editor shows

The write uses the open draft's content (empty for a page just opened from a
reference), not an empty string, so a reveal during unsaved typing creates the
page without discarding what is on screen. The trailing-blank-line normalization
is the same one the editor seed uses, so the file reads back identically.

## Risks / Trade-offs

- [A user who only peeks at the status bar ends up with an empty file] → The
  action is an explicit "show this page in Files", and an empty page is a valid
  page in this vault model; the alternative was a dead control with no
  explanation.
- [The reveal now waits on a write] → The wait is one save round-trip through the
  same write-through path a keystroke uses, and the pending-reveal effect already
  covers the deferral.
- [A failed write leaves the reveal undone] → Nothing is revealed and the write
  failure surfaces the way any save failure does; no partial state is added.
