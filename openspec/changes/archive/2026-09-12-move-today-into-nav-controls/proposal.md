## Why

Today is a navigation control — "take me to today's note" — but it sits inside the Journal accordion, so collapsing that section hides it, and reaching it means finding the calendar first. Back and Forward are the same kind of control (session navigation), already live in the sidebar's sticky control row, and stay in reach however long the page list grows. Today belongs with them.

## What Changes

- **Move the Today control** out of the Journal calendar's header into the sidebar's navigation control row, after Back and Forward. The row becomes Back / Forward / Today.
- **The Journal calendar keeps its month chevrons and grid** and loses its Today button; the section's header is just `‹ Month ›`.
- **The calendar still follows Today.** The grid already re-anchors when the open day changes, and the control's activation also reaches it directly, so clicking Today lands the calendar on today's month — including when today's journal is already the open page and the user has browsed the grid away with the month chevrons, which is a case the calendar can no longer notice on its own once the control lives outside it.
- **Today is always rendered, disabled without a usable vault** (`graph === null`: no folder open, or the index is still building). Same treatment as Back and Forward, which are also always present and disabled when there is nowhere to step. It is no longer gated by whether the Journal section is open, because it no longer lives in it.
- No requirement is **BREAKING** in a user-visible sense: every behavior Today has today (opens the current day, creating nothing, and the grid follows) is preserved. The control moves.

## Capabilities

### New Capabilities

None. The control already exists; only where it renders changes.

### Modified Capabilities

- `ui-shell`: the sidebar's navigation control row now holds Back, Forward, and Today (the requirement currently names only Back and Forward); the journal-calendar requirement loses its Today clause and re-declares its "Today opens the current day's journal" scenario against the control's new home, since the calendar still follows that day.

## Impact

- `src/components/Sidebar.tsx` and `Sidebar.module.css`: the Today control joins the sticky row; a new `onToday` prop (stable identity, per the memo inventory).
- `src/components/JournalCalendar.tsx` and `JournalCalendar.module.css`: the Today button and its handler are removed.
- `src/App.tsx`: one `useCallback` handler that opens `journals/<today>.md` through `handleSelect`, so the open is recorded in the trail like every other navigation.
- Tests: `JournalCalendar.test.tsx` (cell/control counts, the Today navigation case), `Sidebar.test.tsx` (the control row), `App.test.tsx` (the no-vault Today expectation).
- Specs: `ui-shell`.
- Related ADRs: none changed. ADR-0001 (opening still writes nothing), ADR-0004 (no new state), ADR-0005 (the shell stays small: no new surface, one control moved).
