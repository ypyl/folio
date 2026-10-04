# Tasks

## 1. The divider

- [x] 1.1 Add `border-top: 1px solid var(--border-soft)` and `padding-top: 6px` to `.window + .window` in `src/components/MatchBody.module.css`, keeping the existing `margin-top: 6px`. Verify: the stylesheet test asserts the divider declaration on the adjacent-window rule.
- [x] 1.2 Confirm the divider is presentational only: it adds no element, no text, and no control. Verify: the `MatchBody` render tests are unchanged and still pass.

## 2. Records

- [x] 2.1 Name the divider in DESIGN.md's "Search result rows" section. Verify: the DESIGN.md text names the divider and the token.
- [x] 2.2 Bump `version` in `package.json` (patch: a visual fix).
- [x] 2.3 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, the full suite, and `npm run build`. Verify: lint exit 0, type-check clean, build clean, only the pre-existing date-dependent test failures remain.
