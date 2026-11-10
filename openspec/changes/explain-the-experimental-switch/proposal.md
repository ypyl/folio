# Proposal

## Why

The rail's experimental control is a flask icon with a `title` tooltip and a
pressed state. Nothing says what turning it on does. A person either clicks it
blind or never clicks it, and the features it gates — today the session trace —
stay undiscovered. The switch should say what it enables before it is used.

## What Changes

- **A hover and focus popup on the experimental control.** Pointing at the
  control, or focusing it from the keyboard, shows a small floating panel that
  names each gated feature and one line on what turns on. It hides when the
  pointer or focus leaves, takes no pointer input, and sits beside the control
  so it never covers the rail.
- **The list comes from the flags module.** `src/features.ts` gains a
  description per build-time flag, and a test keeps the two in step: a new flag
  without its description fails the suite rather than hiding from the popup.
- **Nothing changes about the switch itself.** Same control, same place in the
  rail, same `aria-pressed`, same persisted preference, same effect. The popup
  adds a description and no new interaction: it is not a menu, a click panel, or
  a settings surface.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `prerelease`: the experimental control gains a popup that explains what the
  switch enables, on hover and on keyboard focus.

## Non-goals

- No settings surface, no feature list elsewhere in the app, no per-feature
  toggle: one switch, one description.
- No change to the control's accessible name, its `aria-pressed` state, its
  placement in the rail, or the tour control staying last.
- No change to which features a build gates, or to the trace's own behavior.
- No click-to-open panel and no dismissal affordance: a hover tip disappears
  when the pointer or focus leaves, the way a tooltip does.
- No new capability, so the version bump is a patch.

## Impact

- `src/features.ts`: `ExperimentalFeature`, the descriptions, and the
  flag-to-description coverage.
- `src/components/FolderRail.tsx` and its CSS: the popup, its positioning, and
  its surface.
- `src/App.tsx`: passes the feature descriptions to the rail.
- Tests: the coverage rule, the rail's hover and focus behavior, and an e2e
  assertion that the popup lands beside the rail.
- `openspec/specs/prerelease/spec.md` (via this change's delta), `DESIGN.md` if
  the floating-surface recipe needs the popup named.
