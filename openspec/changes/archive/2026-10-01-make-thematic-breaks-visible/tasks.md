# Tasks

## 1. Styling

- [x] 1.1 In `src/components/EditorPane.module.css`, change the `hr` rule's `border-top` to `1px solid var(--stone)`, keep weight and margin, and carry a comment naming the treatment (ink, not border) and the change.
- [x] 1.2 Update `DESIGN.md`'s Editor document section: a thematic break is drawn in `--stone`, subordinate to text, with the weight and margin unchanged.

## 2. Verification

- [x] 2.1 Run `npx vitest run`. Six tests fail, none of them this change: `App.test.tsx` (3) and `JournalCalendar.test.tsx` (3) hardcode September 2026, and the run happened after the local date rolled to 2026-10-01. Confirmed identical on HEAD with this change stashed. No test covers the rule's colour; the block, parse, and serialization tests stay green.
- [x] 2.2 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; confirm no lint or format issue remains, then `npm run build` succeeds.
- [x] 2.3 Check the rendering in Chromium over a vault with a page holding several `---` breaks (top-level, and one inside a blockquote): the rule reads clearly as a line, stays subordinate to the text, and is visibly lighter than the body text. Sweep dev servers with `npm run kill:dev`.
- [x] 2.4 Bump `version` in `package.json` (minor, a user-facing rendering change).
