## 1. Date derivation (pure helper)

- [x] 1.1 Add `journalDate(path): string | null` to `src/vault/index.ts` next to `stem`/`kindOf`: returns `'YYYY-MM-DD'` for paths matching `journals/\d{4}-\d{2}-\d{2}.md`, else `null`. Verify: `npx vitest run src/vault/index.test.ts` with new cases (valid day, non-date journal file -> null, non-journal page -> null) passes.
- [x] 1.2 Add a local-date guard so day strings are built from local `year/month/day` parts, never `toISOString()` (UTC drift at midnight). Verify: a test asserts the day string of a `Date` near local midnight equals the local calendar day.

## 2. JournalCalendar component

- [x] 2.1 Create `src/components/JournalCalendar.tsx` + `JournalCalendar.module.css`: Sunday-first 42-cell grid (6 rows x 7), weekday header row, cell per day with tokens per design D3 (`--stone` base, `--brand-tint` fill for days with files, `--brand` ring for the open day, emphasized today number, dimmed out-of-month cells). Verify: `npm run build` passes and the component renders a 42-cell grid for a known month in a component test.
- [x] 2.2 Implement month navigation: previous/next header controls browse months without opening a day; clicking a day (in- or out-of-month) navigates and re-anchors the grid to its month; the grid still follows the open day across other navigations; Today opens and re-anchors to the current day. Verify: component tests for chevron browsing (view-only), day-click re-anchor, external-path follow, and Today.
- [x] 2.3 Test cell marking: a `journalEntries` prop containing `journals/2026-09-06.md` marks only that cell (design D3), and unmarked days are plain. Verify: component tests using `getByRole('button', { name })` on day cells.

## 3. Wiring into Sidebar and App

- [x] 3.1 `Sidebar.tsx`: replace the journal `renderRow` list with a `JournalCalendar` render; add a `hasVault: boolean` prop that hides the calendar body when false (Journal section renders empty per the no-folder spec). Verify: `npm run build` + existing tests stay green; a Sidebar render without `hasVault` shows no grid.
- [x] 3.2 `App.tsx`: pass `hasVault={graph !== null}` to Sidebar; `journalEntries`/`activePath`/`onSelect` continue through as-is. Verify: `npm run build` passes; no other App changes needed.

## 4. Integration and gates

- [x] 4.1 Add an App-level test with the fixture vault: open the app, click a calendar day that has no file -> a blank page opens (save indicator reads as a new page) and no `.md` appears in the fake vault; type content and let the save land -> `journals/<day>.md` exists with the typed content and the calendar cell becomes marked. Verify: test passes against `App.test.tsx`'s fake-handle harness.
- [x] 4.2 Run full gates: `npm test` (all files, coverage >= 80), `npm run lint` (no new warnings), `npm run build`, `openspec validate --changes`. Verify: all green.
- [x] 4.3 Dev smoke: `npm run dev`, open the sample vault; Journal section shows the calendar marking 2026-09-02..06; click an empty day -> blank page, no file until typing; write -> day lands under `journals/` and the cell fills; Today opens the current day; no vault -> no calendar. Verify: manual.