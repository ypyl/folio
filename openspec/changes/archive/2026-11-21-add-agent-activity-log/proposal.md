# Proposal

## Why

An AI agent that acts on the user's notes has to leave a trace the user can read.
Folio is about to gain a tool surface an installed browser agent can call
(`add-webmcp-tools`), and the first thing that surface needs is somewhere to say
what it did: which page, which tool, and what changed. Without that, an agent's
edit is indistinguishable from the user's own, and the app's only explanation is
a `write path=…` line in `.folio/logs/`.

AGENTS.md requires a capability a user could notice to ship behind two layers, a
build-time flag and the app's experimental switch. That infrastructure is not in
the tree: it retired when the session trace shipped in every build (`afbd292`),
and nothing in `src/` or `openspec/specs/` carries a flag or a switch today. So
this change restores the toggle and delivers the first thing it gates, the
record of agent actions and the one surface that shows it. The tool surface
follows in `add-webmcp-tools`, off by the same switch.

## What Changes

- **The experimental toggle returns, in its recorded shape.** `src/features.ts`
  with one off-by-default build-time flag per gated capability,
  `experimentalFeatures` describing each flag with a coverage test, the rail's
  control with `aria-pressed` and its hover/focus popup, `src/prerelease.ts` with
  a browser-local `folio.prerelease` boolean, and the effective gate
  (`flag || switch`) computed once in `App` and passed down as a prop.
- **The rail's experimental control sits above the bottom group.** The bottom
  group holds exactly one control (the demo's tour, otherwise feedback), so the
  restored control takes its own slot above it rather than a second place inside.
- **An agent-activity record exists.** One entry per action taken on the user's
  behalf: the tool's name, the path it touched, what changed in counts, and the
  time. Kept in memory for the session, bounded, and mirrored as one `agent` line
  in the existing session trace.
- **The status bar offers the record behind a disclosure.** A trailing entry
  reads `agent: N` and opens a panel listing the entries, newest first; each row
  opens the page it names. At or below the compact breakpoint the entry renders
  nothing, because the compact shell has no status bar.
- **The gate decides everything.** While the gate is off, no entry is recorded
  and neither surface renders. The record and the surfaces are the gated
  capability; the existing trace format and its seven-day pruning are unchanged.

This change also restores the `prerelease` capability spec, which was removed
with the infrastructure (see `adr/README.md`, ADR-0036).

## Capabilities

### New Capabilities

- `prerelease`: the build-time flag module, the app-level experimental switch,
  its rail control and popup, its persistence, and the effective gate.
- `agent-activity`: the record of actions taken on the user's behalf, what it
  names, what it must not contain, its surface on the status bar, and its
  absence while the gate is off.

### Modified Capabilities

- `workspace`: the folder rail carries the experimental control above its bottom
  group; the status bar's controls gain the activity entry.
- `diagnostics`: the trace records an action taken on the user's behalf with the
  tool that took it, alongside the write it caused.

## Non-goals

- **No revert.** The record is a log, not a ledger: an agent's action is
  reviewable, not undoable in the app (ADR-0036). Git is the undo.
- **No approval step and no permission model.** An agent acts as the user; the
  record is the acceptance mechanism, not a gate on individual actions.
- **No settings surface and no per-feature switch.** One switch, one description
  per flag, as `explain-the-experimental-switch` settled.
- **No sidebar row marks** for pages an agent touched. The status bar entry is
  the one surface; a row mark would change the Files listing's row contract.
- **No tool surface and no WebMCP registration.** That is `add-webmcp-tools`.
- **No change to the trace's content rule.** The trace still holds no page text.
- **No version or changelog history in the record**: the record is what this
  session's agent did, not a second changelog.

## Impact

- `src/features.ts`, `src/features.test.ts`: restored, with `agentTools` off by
  default and its description.
- `src/prerelease.ts`, `src/prerelease.test.ts`: restored.
- `src/components/FolderRail.tsx` and `.module.css`: the control, its popup, and
  the slot above the bottom group.
- `src/App.tsx`: the switch, the effective gate, the record, and the props.
- `src/agent/activity.ts` (new): the entry type, the bounded list, and the trace
  mirror.
- `src/components/StatusBar.tsx` and `.module.css`: the activity disclosure and
  its panel.
- `src/trace/session.ts`: no format change; one new event name from the record.
- Tests: the coverage rule, the switch and its persistence, the record's bounds
  and its trace line, the status bar's disclosure, and the gate-off absence.
- `DESIGN.md`: one line where the status bar's controls are described.
- Version bump: minor, because the switch and the surface are user-noticeable.
