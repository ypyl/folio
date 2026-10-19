# Tasks

## 1. The menu heading

- [x] 1.1 Add an optional `heading` prop to `RowContextMenu`, rendering a visible non-focusable line and a `role="group"` named by it; a component test asserts the group name, the visible text, and that the heading is not a menuitem. Verify the test passes.
- [x] 1.2 Pass `Reminder` from the Sidebar day menu; a Sidebar test asserts the menu holds a group named `Reminder`. Verify the test passes.
- [x] 1.3 Style the heading with `DESIGN.md` tokens (muted, small, uppercase); verify the stylesheet carries the rule and the existing menu tests pass.

## 2. Docs and version

- [x] 2.1 Mention the heading in the README's Reminders section if it helps, and bump `version` in `package.json` (patch). Verify the version reads as a distinct build.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
