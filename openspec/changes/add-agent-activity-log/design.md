# Design

## Context

See `proposal.md` for why. The relevant current state:

- `src/features.ts` and `src/prerelease.ts` existed until `afbd292` ("ship the
  session trace in every build") deleted them; `8620dc6` and `e060125` carry the
  exact modules, and `explain-the-experimental-switch` carries the popup. The
  shapes are recorded, not invented here.
- The rail's bottom group is now specified as **exactly one control** (the demo's
  tour, otherwise feedback), so the restored switch cannot go back inside it.
- `workspace` enumerates the status bar's controls: the version's disclosure and
  the open page's name. A new control is a requirement change, not an addition.
- `diagnostics` specifies the trace as paths, sizes, counts, durations, and error
  messages, with no page text, pruned to seven days. `TraceSink.event()` already
  takes `(level, name, fields)`, so a new event name needs no format change.
- `App` already threads a `session` sink into the layers that record, and the
  index is disposable and rebuilt per folder (ADR-0004).

## Goals / Non-Goals

**Goals:**

- Restore the toggle in the shape the history records, not a fresh design.
- One record type, one producer, one surface, one gate.
- Nothing on the typing path, nothing in the vault beyond the existing trace.

**Non-Goals:**

- No per-entry interactivity beyond opening the page it names: no filtering, no
  "show me the diff", no dismiss-per-entry.
- No persistence of the record itself: it is session state, and the trace file is
  the durable half.
- No change to the trace's retention, pruning, or ordering.

## Decisions

**D1: The flag module and the switch are restored as they were.**
`features.agentTools = import.meta.env.VITE_AGENT_TOOLS === '1'`,
`experimentalFeatures` with one `{ flag, label, detail }` per key, and
`features.test.ts` keeping the two sets equal in both directions. The switch is
`readPrerelease`/`writePrerelease`/`usePrerelease` over the key
`folio.prerelease`, absent meaning off, storage failure leaving the in-memory
value. Alternative rejected: a new preference store. AGENTS.md fixes the shape,
and the two removals left nothing to migrate.

**D2: The control takes its own rail slot above the bottom group.**
The bottom group's "exactly one control" exists so the demo tour and the feedback
control never compete. The switch renders above the group, so both rules hold at
once: the group keeps one control and the tour stays the rail's last control.
Alternative rejected: relaxing the group to two controls, which would make the
demo rail carry three things at its bottom edge.

**D3: The gate is computed once and passed down.**
`const agentEnabled = features.agentTools || prerelease` in `App`, threaded to
the record's producer, the status bar entry, and (in `add-webmcp-tools`) the tool
registration. Nothing re-reads the flag, so a test can flip either layer without
remounting the world and the surfaces cannot disagree.

**D4: The record is a bounded array of plain entries.**
`ActivityEntry = { at, tool, path, added, removed, kind }`, where `kind` is the
row's subject (page, journal day, board, appointment-free text). Kept in a ref and
mirrored into state once per flush of the producer, capped at 200 entries with the
oldest dropped, which is the trace's own line-cap precedent. Each entry also emits
`session.event('info', 'agent', { tool, path, added, removed })`, so the durable
half is one existing-format line with no page text.

**D5: The surface is a status-bar disclosure, and it is absent on the compact
shell.** Above the compact breakpoint the bar's trailing group gains one control
beside the version badge, reading `agent: N` and opening a panel above the bar's
trailing edge with the entries newest first. A row activates the page it names
through the app's existing open path. At or below the compact breakpoint nothing
renders: the compact app bar's status line is specified as the save state or the
indexing label, and widening it would make that line mean three things.

**D6: Nothing exists while the gate is off.** No entry is created, the status bar
entry does not render, and no prop is passed. The record module, its tests, and
the trace event name stay, so flipping either layer is the whole enable step.

## Keystroke budget

What does this add to the typing path, and what does that cost scale with?

- Nothing. A keystroke never touches the record: entries are appended only when
  an action lands, which is off the typing path by construction (`add-webmcp-tools`
  is the only producer). The status bar reads a memoized entry count and a
  memoized rendered list, so a keystroke re-renders two text nodes at most.
- The record's cost scales with the number of agent actions in a session, not
  with the vault or the open document: a push into a 200-entry array, and one
  trace line through the existing debounced sink.
- The switch cost is one `localStorage` read on mount.

Measurement: `src/agent/activity.test.ts` pins the cap (200 entries, oldest
dropped, one trace event per append) and `StatusBar.test.tsx` pins that the panel
renders from a passed list, so no per-entry work happens during typing.

## Testing

- Unit: the coverage rule (`features.test.ts`), the preference's persistence and
  its storage-failure path, the record's cap and its trace mirror.
- Component: the rail's control and popup, the status bar's disclosure, its
  panel, and its absence at the compact breakpoint.
- Integration: with the gate off nothing is recorded and no entry renders; with
  the gate on an appended entry appears in the panel.
- e2e: with `VITE_AGENT_TOOLS=1`, an appended entry is visible through the
  status bar; the shipped build shows no entry.
