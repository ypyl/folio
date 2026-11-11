# Tasks

## 1. The changelog artifact

- [x] 1.1 Write `scripts/changelog.mjs`: read `git log` oldest-first, keep `feat:`/`fix:` subjects, strip the prefix, write `CHANGELOG.md` at the repo root with a short header and `## <YYYY-MM-DD>` groups (newest first, one `- <subject>` bullet each, newest 40 entries kept); wire it as `npm run changelog`; verify the file it writes is grouped by date, newest first, and holds no `feat:`/`fix:` prefix.
- [x] 1.2 Run the script and commit `CHANGELOG.md` with the entries it produces; verify `git status` shows the file tracked and `node -e` reading it prints the newest entry.

## 2. The parser

- [x] 2.1 Add `src/changelog.ts` exporting `recentChanges: { date, text }[]` parsed from `CHANGELOG.md?raw`, newest first and capped at 20; ignore lines that are not date headings or bullets, and export an empty array when nothing parses; verify `npx tsc -b` accepts the `?raw` import and the module has no render-time work.
- [x] 2.2 Add `src/changelog.test.ts` covering a dated group, a bullet list under it, the newest-first order, the cap, and a malformed file yielding what did parse; verify `npx vitest run src/changelog.test.ts` passes.

## 3. The badge's disclosure

- [x] 3.1 In `StatusBar.tsx`, render the version as a `<button type="button">` carrying `aria-expanded` and `aria-controls`, wrapped in a `relative` container, only when not `compact`; when `recentChanges` is empty keep it the plain text label; verify the existing bar tests still find the `v<version>` text.
- [x] 3.2 Add the panel: an anchored child listing each entry's text and date, newest first, in a scrolling body under a fixed heading, present only while open; verify with a component test that opening renders the entries in order and closing removes them.
- [x] 3.3 Bind the dismissals while open — a second activation, a captured `pointerdown` outside the panel, `Escape`, and window `blur` — and keep focus on the badge; verify each dismissal closes the panel and that `Escape` closes it from the button and from elsewhere on the page.
- [x] 3.4 Style the badge as a control that keeps its stone treatment plus a visible focus ring, and the panel with the app's floating-surface recipe (ivory fill, hairline border, whisper shadow, 8px radius, stone 12px text, capped width, scrolling body) in `StatusBar.module.css`; verify a long list scrolls inside the panel and the bar's height does not change.
- [x] 3.5 Extend `src/components/StatusBar.test.tsx` with the new spec's scenarios: the badge reports open state, entries read newest first with their dates, each dismissal closes without moving focus, and `compact` renders neither badge nor panel; verify `npx vitest run src/components/StatusBar.test.tsx` passes.

## 4. End-to-end and docs

- [x] 4.1 Add an e2e case to `tests/e2e/workspace.spec.ts`: activate the badge, see the panel's heading and newest entry, press `Escape`, and see it closed; verify `npx playwright test tests/e2e/workspace.spec.ts` passes against a fresh `npm run dev:test` build.
- [x] 4.2 Document the panel in `DESIGN.md` (its recipe and that it is the one surface the status bar opens) and name the badge as the in-app changelog in `README.md`; verify both describe what the app does and introduce no new token.
- [x] 4.3 Add the regenerate-the-changelog clause to `AGENTS.md`'s version-bump rule, naming `npm run changelog`; verify the rule reads as one step of a commit, not a second process.

## 5. Verification

- [x] 5.1 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, and `npm run build`; verify all are clean and the built bundle carries the changelog text.
- [x] 5.2 Run the full unit and integration suite and the full e2e suite; verify both pass.
- [x] 5.3 Bump `package.json`'s version (minor, a new user-facing capability) and re-run `npm run changelog` so the newest entry and the badge agree; verify the built badge's panel lists the change that just landed.

## Workflow follow-up

- Archive the change, syncing its delta into `openspec/specs/workspace/spec.md`, and bump the version again (patch) in the archive commit.
- Push `master` to `origin` and `nas`.
