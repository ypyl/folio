## Context

See `proposal.md` for why. The facts that shape the approach:

- The sidebar's navigation control row is the sidebar's first child, `position: sticky; top: 0`, and today holds two 26x26 icon buttons (`styles.control`), disabled when there is nowhere to step (`src/components/Sidebar.module.css`, `add-history-navigation` D4).
- `Sidebar` is memoized, and its bail-out depends on every prop keeping its identity. The inventory is a comment in `src/components/Sidebar.tsx`; any new prop belongs in it. It already receives `hasVault` (`graph !== null`) and `activePath`, and it renders both the navigation control row and the journal calendar, so a signal between them can stay local to it (D3).
- `JournalCalendar`'s displayed month is deliberately component-local and re-anchors to the open day from an effect keyed on the open day's date; chevron browsing is the intended case where the view differs from that anchor (`journal-calendar` D2/D4). Today's own button re-anchored the grid *directly* — `openDay(today)` did `setView(monthOf(today))` — so it re-anchored even when today's journal was already open and the grid had been browsed away. Nothing else can reproduce that once the control lives outside the component.
- `App` owns navigation: every route into a page funnels through `handleSelect`, which sets `activePath`, baselines the draft, and is what the trail-recording effect observes. The auto-open of today's journal on folder open uses `journals/${localDayString(new Date())}.md` computed in the effect, not at module scope.

## Goals / Non-Goals

**Goals:**

- One Today control, in the row that already holds the session navigation controls, reachable whether or not the Journal section is open and however long the page list is.
- Today behaves exactly as it does today: opens the current day's journal through the ordinary navigation path (trail recorded, nothing written, blank page materializes on first save) and leaves the calendar showing today's month, including the already-open case.
- No new per-keystroke work and no new vault-proportional work.

**Non-Goals:**

- No header/top-bar control: the shell's header keeps brand + search only (`ui-shell`).
- No change to Back/Forward, the trail model, the windowed listing, or the memo's granularity.
- No keyboard chord for Today.
- No second copy of the control inside the calendar, and no new icon.
- No change to the calendar's grid, chevrons, or day-cell behavior.
- No ADR: no boundary, no persistence rule, no cross-ADR coupling (`proposal.md` Impact).

## Decisions

### D1 The control is a labelled button in the existing row, after Forward

The row reads `[ ‹ ] [ › ] .......... [ Today ]`: the two trail controls lead it, and Today is pushed to the row's right edge (`margin-left: auto`), so the pair that walks the session stays together at the reading start and the one date-shaped action sits apart at the end. Today is a text button: the word is unambiguous, needs no glyph and no tooltip, and the row has space at the sidebar's fixed width. It reuses the row's control treatment — stone at rest, brand on hover/focus, the Kami focus ring, dimmed when disabled — but sizes to its label (auto width, 26px height) instead of the icons' fixed square.

Rejected: a third chevron-style icon button (a new glyph for a concept a word already names, and an icon-only control needs an accessible name that reads the same as the text). Rejected: a primary/secondary `.btn-*` button from `DESIGN.md`, which is the form-button variant and too heavy for a control row. Rejected: all three controls grouped at the start (Today is a different kind of action — it opens a specific page, it does not step through the trail — and the row's trailing corner is otherwise empty).

### D2 Rendered always, disabled while the vault is not usable

`disabled={!hasVault}` where `hasVault` is `graph !== null` — the prop `Sidebar` already takes and the same condition that gates the calendar and enables search. So the control is disabled during indexing as well as with no folder open, and cannot try to open a page into a folder whose index does not exist yet.

Rejected: hiding it without a vault (the calendar's old behavior, which is what made the control unavailable). Hiding would make the row's content change with app state and reintroduce "the control is not there when I look for it", which is the problem this change solves. Back and Forward are already always present and disabled when unusable, so this is the row's established treatment.

### D3 The row owns the tick that keeps Today re-anchoring the grid

```
  Sidebar:  const [todayTick, setTodayTick] = useState(0)   // the calendar's anchor signal

            onClick={() => { setTodayTick(t => t + 1); onToday?.() }}   // the control

  JournalCalendar:  useEffect(() => { if (activeDate) setView(monthOf(activeDate)) },
                    [activeDate, todayTick])
```

The effect's body is unchanged; the tick is only an extra reason to re-run it. After a Today activation `activeDate` is today, so the grid lands on today's month whether or not the open day changed. Without the tick, the already-open case (browse months, then Today) leaves the grid on the browsed month and the control looks inert exactly when the user is asking to come back to today.

The tick lives in `Sidebar`, not `App` as first planned: the row renders the control *and* the calendar, so the signal can be local state. That is one fewer prop to thread through `App` and to keep stable in the memo inventory, and the tick cannot exist without the control that bumps it. `App` keeps only the navigation: `handleToday` opens today's journal, and the day is read at activation rather than at mount, so a session left open across midnight goes to the new day.

Rejected: accepting the drift (a visible regression in the control's main use). Rejected: a second, view-anchoring Today inside the calendar (two controls for one action, and the calendar's header is the thing this change empties out). Rejected: lifting the calendar's view state into `App` (the view is intentionally component-local so chevron browsing re-renders the calendar and nothing else).

### D4 The activation is an ordinary navigation

`handleToday` calls `handleSelect`, not a bespoke path: the open is recorded in the session trail (`page-history`), the results view closes, the draft is baselined, and an absent file opens as a blank page that materializes on first save. Today needs no navigation logic of its own.

Rejected: a separate `setActivePath` + draft-seeding path in the handler (a second route into a page, which is what the single recording effect exists to avoid).

### D5 Nothing new on the keystroke path

The row renders three static controls; the calendar renders 42 day cells and two chevrons instead of 43 cells and three controls. `onToday` is a stable `useCallback` and `hasVault` is a primitive, so `Sidebar`'s memo still bails on ordinary typing; the tick is internal state, and changing it re-renders the sidebar's viewport-bounded listing once, on a navigation. The one new piece of state is a number in `Sidebar`. Nothing added here scales with the vault or the open document, so this change carries no measurement.

### D6 The calendar header spans the panel, with the month centered

Taking Today out of the calendar left the month cluster alone in the corner of a full-width section, which reads as an unfinished header. The header now uses the panel's width: `‹` at the left edge, `›` at the right edge, and the month label centered between them. The label is what stretches (`flex: 1` with `text-align: center`), not the buttons; because the two chevrons are the same 28px square, the label's box is symmetric, so its center is the panel's center rather than the space left over. The grid and the weekday row below already span the panel, so this is the header joining them.

The spec never places the month controls or the label, so this is a design-level decision with no behavior delta: the requirement is that the section displays the open day's month and offers the chevrons, which is unchanged.

Rejected: `justify-content: space-between` across the three items (the same result here, but the label's centering then rests on its neighbours happening to be equal width instead of on a box that is itself centered). Rejected: leaving the cluster at the left and the right half empty (the header would be the only element in the section not using the section's width).

## Risks / Trade-offs

- [A new `Sidebar` prop silently disables the memo] → `onToday` is the only new prop and it is a stable `useCallback`; the prop-stability inventory comment in `Sidebar.tsx` is updated in the same commit. The tick is `Sidebar`'s own state, so it never reaches the memo's prop comparison.
- [The grid stops following Today in the already-open case] → D3's tick dependency, with a calendar test that browses away and then activates Today while today's journal is open.
- [A disabled Today reads as broken rather than as unavailable] → the same visible dimming and the same reason as Back/Forward with nowhere to step; the status bar already reports the indexing state while no vault is usable.
- [Two "today" computations drift] → there is still one source, `localDayString(new Date())`, read at activation in `App` and per render in the calendar for cell marking; neither is cached at module scope.
- [Existing tests encode the old placement] → expected and part of the change: the calendar's button count and its Today navigation case move, and `App.test.tsx`'s "no Today before a folder opens" expectation becomes "present but disabled".
- [Today's focus ring lands in a row that also holds disabled controls] → the ring is the app's standard `:focus-visible` treatment, already shared with Back and Forward; a disabled button is not focusable, so tabbing never lands on a dead control.

## Open Questions

- Whether Today should mark itself (an active or current styling) while today's journal is the open page. Deferrable: it changes no requirement and no behavior, only styling, and the calendar already marks today's cell.
- Whether the control should carry a hover title beyond its accessible name. Polish, deferrable to implementation.

## Migration Plan

Nothing to migrate: no vault state, no storage, no `.folio/` content, and no persistence is touched — the control opens a page through the existing path, and merely activating it still creates no file (ADR-0001). Only specs change (`ui-shell`: the control row requirement gains Today and the calendar requirement loses it). Reverting the change restores the previous placement and behavior completely.
