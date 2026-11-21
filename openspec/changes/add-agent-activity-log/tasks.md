# Tasks

## 1. Restore the flag module and the switch

- [x] 1.1 Add `src/features.ts` with `features.agentTools`
  (`import.meta.env.VITE_AGENT_TOOLS === '1'`), the `ExperimentalFeature` type,
  and one description for it (label `Agent tools`, detail naming the record and
  the tool surface); add `src/features.test.ts` with the coverage rule in both
  directions. Verify: `npx vitest run src/features.test.ts` passes, and deleting
  the description fails it.
- [x] 1.2 Add `src/prerelease.ts` with `readPrerelease`, `writePrerelease`, and
  `usePrerelease` over the `folio.prerelease` key, absent meaning off and a
  storage failure leaving the in-memory value; add `src/prerelease.test.ts` for
  the round trip and the unavailable-storage path.
- [x] 1.3 Add the rail's experimental control above the bottom group in
  `src/components/FolderRail.tsx` (props `prerelease`, `onTogglePrerelease`,
  `experimental`; `aria-pressed`, accessible name, visible focus) and its popup
  (hover and focus, `aria-describedby`, no pointer input, fixed from the
  control's box, absent when the list is empty); add the CSS in
  `FolderRail.module.css` using the floating-surface recipe. Verify with
  `FolderRail.test.tsx` cases for the flip, the popup on hover and on keyboard
  focus, the dismissal on leaving, and the empty list.
- [x] 1.4 Thread it through `src/App.tsx`: `usePrerelease`, the effective gate
  `features.agentTools || prerelease`, and the props to the rail. Verify an
  `App.integration.test.tsx` case that the switch flips and reports its state.

## 2. Record activity

- [x] 2.1 Add `src/agent/activity.ts`: `ActivityEntry`
  (`{ at, tool, path, added, removed }`), the bounded list (cap 200, oldest
  dropped), and the append that emits one trace event per entry through a passed
  sink; add `src/agent/activity.test.ts` pinning the cap, the order, and exactly
  one trace event per append.
- [x] 2.2 Add `src/agent/useActivity.ts` (or a hook in the same module) that holds
  the list in a ref, mirrors it into state once per append, and exposes a
  memoized count and a memoized rendered list; wire it in `src/App.tsx` behind
  the effective gate. Verify with a test that the gate off appends nothing.

## 3. Show it on the status bar

- [x] 3.1 Add the activity disclosure to `src/components/StatusBar.tsx`: a
  trailing control reading `agent: N` with `aria-expanded`, its panel above the
  bar's trailing edge listing entries newest first, and the four dismissals
  (second activation, outside press, `Escape`, shell losing focus); rows activate
  the page they name through a passed callback. Verify with `StatusBar.test.tsx`
  cases for the count, the panel, each dismissal, and a row's activation.
- [x] 3.2 Pass it from `src/App.tsx` only while the gate is on, and only above the
  compact breakpoint. Verify with an integration case that no control renders
  with the gate off and that a recorded entry appears with it on.
- [x] 3.3 Add the one DESIGN.md line where the status bar's controls are listed.

## 4. The recorded decisions

- [x] 4.1 Keep `adr/0036-agent-actions-are-app-actions-with-an-actor.md` and its
  `adr/README.md` row in step with what ships (the draft lands with this
  proposal): amend it if the record's shape differs from what is written there,
  and leave the status flip to `add-webmcp-tools`, whose surface is the decision's
  other half.

## 5. Full circle

- [x] 5.1 Run `npx oxlint --fix`, `npm run fmt`, `npx tsc -b`, `npm run test`,
  `npm run build`, and the e2e suite asserting the switch explains itself, flips,
  persists, and that the record's control exists only with the gate on (its
  entries come with `add-webmcp-tools`, which is the only producer); all pass.
- [ ] 5.2 Bump `version` in `package.json` (minor), run `npm run changelog`, and
  commit the feature with its tests, docs, delta specs, and design.
- [x] 5.3 Run `npx oxlint --deny-warnings --format=agent`.

## Workflow follow-up

- Archive the change, syncing the `prerelease` and `agent-activity` deltas into
  `openspec/specs/`, with its own patch version bump.
- Push `master` to every remote (`origin`, `nas`) and publish the release at the
  feature commit.
