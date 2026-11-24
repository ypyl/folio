# Design

## Context

See `proposal.md` for why. The constraints that shape this:

- The shell already has a loading vocabulary: the pane's document skeleton
  (`EditorPane`, `loading`), the sidebar's calendar and row skeletons
  (`Sidebar`, `loading`), the right panel's placeholder rows (`MetaPanel`,
  `loading`), and the status bar's `role="status"` phrase from
  `saveStateLabel(indexing)`. Nothing new needs inventing; the restore window is
  a state that is not wired to them.
- `useVault` settles its `restoring` status either when the restore resolves or on
  a `RESTORE_DEADLINE_MS` of 15 s, so the state cannot hang. That deadline is what
  makes a loading state safe to show: it always ends.
- The diagram box is painted by the runtime, not by the widget or the deck, so a
  placeholder painted there reaches both mounts (design D2 of
  `add-mermaid-diagrams`).
- DESIGN.md: the placeholder pulse is the only motion, never brand-coloured, and
  it stops for reduced motion.

## Goals / Non-Goals

Goals: a slow start explains itself; a waiting drawing is visibly a drawing being
drawn; no flash for a fast start.

Non-goals: any new loading component, any progress measurement, any change to the
restore or the index build themselves.

## Decisions

**D1: the shell's loading flag covers the restore too, held briefly.**
`App` computes `shellLoading = restoreHeld || indexing` and passes it to the three
panes that already take `loading`. The hold is what keeps a first start clean: a
fresh browser, or a warm folder, settles in milliseconds and must not flash
skeletons before an empty brand screen.

**D2: the hold is one small hook, not a timer in each component.**
`useDelayedFlag(value, 150)`: true becomes true only after the value has held that
long, and a value that drops clears the timer, so a start that settles inside the
hold never renders the loading state at all. One flag in `App`, one place to test.

**D3: the status bar names the phase through the copy it already computes.**
`saveStateLabel` gains `restoring`, which outranks `indexing`, which outranks the
save state. The wide bar and the compact bar share that function, so both say
"Opening your notes…" and then "Indexing notes…" with no second source of copy.

**D4: the diagram placeholder is painted by the runtime.**
On `register`, the box gets the app's placeholder and `aria-busy`; the success and
failure paths replace it exactly as they already replace an empty box. The widget
and the deck pass are unchanged, so the placeholder cannot drift between the two
surfaces.

## Risks / Trade-offs

- **A 150 ms start shows nothing for 150 ms** → accepted: the alternative is a
  skeleton flash on every fast start, which is the more visible defect. The hold
  is a constant, and one place to tune.
- **A placeholder that never resolves leaves a busy block** → the restore is
  bounded by `RESTORE_DEADLINE_MS`, and a diagram's pending state always ends in
  a drawing or a note, because the engine's rejection is caught. Nothing can stay
  busy forever.
- **Two phases in one status slot** → the copy is one function with an ordered
  decision, tested, so the two surfaces cannot disagree.

## Open Questions

None.
