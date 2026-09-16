## 1. The date predicate

- [x] 1.1 Add `journalDayName` and `journalDayPath` to `src/vault/index.ts`, beside `journalDate`/`localDayString`. Validate by component, not by `Date` parsing: month 1-12, day within that month's length with a leap-year rule, zero-padded `YYYY-MM-DD` shape. Verify with unit tests in `src/vault/index.test.ts` for `2026-09-16` and `2024-02-29` (accepted) and `2026-02-29`, `2026-13-45`, `2026-9-6`, `09-16-2026`, `2026-09-16T00:00` (rejected); run `npx vitest run src/vault/index.test.ts`.
- [x] 1.2 Make `isPagePath` reject a `pages/` path whose filename stem is a journal day name, at any depth. Verify with tests: `pages/2026-09-16.md` and `pages/notes/2026-09-16.md` are not pages, `pages/2026-13-45.md` is, and `journals/2026-09-16.md` is.

## 2. The resolver

- [x] 2.1 Add `resolveReferencePath(name, byName)` to `src/vault/index.ts`: a journal day name returns `journals/<date>.md`, otherwise the map entry, otherwise `pages/<name>.md`. Verify with unit tests covering a date name with an empty map, a date name whose map entry is a `pages/` path (must still return `journals/`), an existing page, and a missing non-date name.

## 3. Wire the two App sites

- [x] 3.1 Replace the fallback in `handleOpenReference` (`src/App.tsx`) with `resolveReferencePath`. Verify in `src/App.test.tsx`: clicking a `#[[2026-09-16]]` badge with no journal file opens the day, and the status bar breadcrumb reads `journals/2026-09-16.md`.
- [x] 3.2 Replace the fallback in the Forwardlinks row builder (`src/App.tsx`) with the same resolver. Verify in the links-pane tests: a page referencing a date lists a dimmed `2026-09-16` row whose click opens the journal day, and the fake storage records no write.

## 4. Index consequences

- [x] 4.1 Confirm end to end that a date-named file under `pages/` produces no page: no sidebar row, no search hit, no backlink source, and no `byName` entry. Verify with an index test that scans a vault containing `pages/2026-09-16.md` referencing `#Roadmap`, and asserts the page set excludes it and `Roadmap` has no backlink from it.

## 5. ADR and hygiene

- [x] 5.1 Write `adr/0019-date-names-are-journal-days.md` in MADR form, referencing ADR-0001, ADR-0012, and ADR-0015, and add its row to the table in `adr/README.md`. Verify both files exist and the table lists 0019.
- [x] 5.2 Bump `version` in `package.json` to `0.8.2` (patch: a resolution fix, no new surface). Verify the built header badge reads the new version.
- [x] 5.3 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`. Verify the last command reports no warnings.
- [x] 5.4 Run `npm test` and `npm run build`. Verify both pass.
