## 1. Trail state and recording

- [x] 1.1 Add `src/history.ts` with `HISTORY_CAP = 20` and a pure `pushHistory(paths, path)` that returns a new array, newest first, de-duped (a present path moves to the top) and capped; verify `src/history.test.ts` covers first push, move-to-front de-dupe, cap eviction of the oldest entry, and that the input array is not mutated (vitest run).
- [x] 1.2 Add the trail state to `App` and record in one effect keyed on the open page, skipping a null one; verify a new `App.test.tsx` case opens two pages in turn and finds the first one listed once in the History section.
- [x] 1.3 Clear the trail in the existing folder-change reset (the effect keyed on the active folder id); verify an `App.test.tsx` case that navigates in one folder, switches folders, and finds no row from the previous folder and only the new folder's today journal in the trail.
- [x] 1.4 Confirm recording never touches storage; verify an `App.test.tsx` case that spies on `VaultStorage.write` and asserts navigation performs no write and adds no file, including when the opened page is unmaterialized.

## 2. The History section

- [x] 2.1 Add the third `Accordion` to `Sidebar` (after Pages, open by default) and render the resolved rows from a new `history` prop; verify `Sidebar.test.tsx` finds the section after Pages and lists rows most recent first.
- [x] 2.2 Exclude the page currently open and claim no current-page marking; verify a `Sidebar.test.tsx` case where the open page is absent from the rows and no row inside the section carries `aria-current`.
- [x] 2.3 Render a row whose page has no file in the index dimmed but still clickable, using the meta panel's dim treatment, with the `stem()` title; verify a `Sidebar.test.tsx` case asserting the dimmed class and that activating the row calls `onSelect` with its path.
- [x] 2.4 Add the empty state ("Nothing here yet." plus a sentence stating the section lists pages opened this session) shown when the trail holds nothing beyond the open page; verify `Sidebar.test.tsx` cases for a fresh load and for a one-entry trail.
- [x] 2.5 Style the section in `Sidebar.module.css` reusing `styles.list` and `styles.row` and existing Kami tokens, with no new color or spacing values; verify the section renders identically to the Pages rows and `npx oxlint --deny-warnings` passes.

## 3. Keep it off the keystroke path

- [x] 3.1 Give `useIndex` a module-level constant empty pins array instead of a fresh `[]` while the graph is null; verify `useIndex.test.ts` (or a new case) shows the pins prop keeps one identity across renders before the graph resolves.
- [x] 3.2 Wrap the select handler in `useCallback` with exactly `graph` and `drafts` as dependencies (it reads nothing else, notably not the open page); verify the existing `App.test.tsx` navigation cases still pass unchanged.
- [x] 3.3 Wrap `Sidebar` in `memo` and record the prop-stability inventory as a comment on the component; verify a render-count assertion (a `Profiler` in a test or a spy) shows a keystroke in the open page no longer re-renders the sidebar, while a navigation still does.

## 4. Measure and record

- [x] 4.1 Generate a throwaway vault of at least 10k pages outside the repo, then on a production build type a fixed burst in a long page and record per-keystroke render cost and total burst time with the memo and without it; verify the before/after numbers are written into `design.md`.
- [x] 4.2 Repeat the burst with the History section present and with it absent; verify `design.md` records that the section adds no measurable keystroke cost, and drop the memo there if step 4.1 shows no improvement (the memo is behavior-free, so the specs stay untouched).

## 5. Finish

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, and confirm no warnings and no formatting diff.
- [x] 5.2 Run `npm run build` and `npm test`, and confirm the full suite passes with the new history and sidebar tests included.
- [x] 5.3 Add the feature as a numbered entry in `PLAN.md`; verify the entry exists and reads as current work, to be marked `[x]` when the change is archived.
- [x] 5.4 Confirm no ADR is needed (no new vault state, no persistence, no security or cross-ADR boundary) and note the confirmation in the change summary.
