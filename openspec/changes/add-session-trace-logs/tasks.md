# Tasks

## 1. Restore the experimental switch

- [x] 1.1 Add `src/features.ts` with `features.trace` from
  `import.meta.env.VITE_TRACE === '1'`, off by default; verify
  `npx vitest run src/features.test.ts` (a test asserts the default) and that
  `npm run build` with no env var reports the flag off.
- [x] 1.2 Restore `src/prerelease.ts` and its test from the
  `add-prerelease-mode` change (the `folio.prerelease` `localStorage` key,
  `readPrerelease`, `writePrerelease`, `usePrerelease`); verify
  `npx vitest run src/prerelease.test.ts` passes, including the storage-unavailable
  case.
- [x] 1.3 Restore the prerelease control in `src/components/FolderRail.tsx` and
  its CSS from the same change: `prerelease` and `onTogglePrerelease` props, the
  control with `aria-pressed`, sitting before the tour control; verify
  `npx vitest run src/components/FolderRail.test.tsx` covers pressed state,
  ordering, and the accessible name.
- [x] 1.4 Wire the switch into `App`: `usePrerelease`, the rail props, and the
  effective gate `features.trace || prerelease` computed once; verify
  `npx vitest run src/App.integration.test.tsx` shows the control toggling
  `aria-pressed` and the gate reaching the session trace.

## 2. The trace sink

- [x] 2.1 Create `src/trace/session.ts` with the line format, the 2000-line
  buffer with the truncation marker, the 1 s debounce, the serialised flush
  queue, `event`, `flush`, and `end`; verify unit tests in
  `src/trace/session.test.ts` cover buffering, one write per flush, the cap and
  its marker, and a rejected write leaving the action untouched and reporting
  once to `console.warn`.
- [x] 2.2 Add the file name and the seven-day pruner to the sink: UTC
  `YYYY-MM-DDTHH-MM-SSZ-<4 hex>.log`, prune on `start` of files matching that
  pattern older than seven days, leaving every other file alone; verify unit
  tests cover the boundary (6 vs 8 days), a foreign file surviving, and the
  pruner never touching another path.
- [x] 2.3 Add the storage decorator to the same module: `write` and
  `writeBinary` recorded with size and duration, `read`/`stat` failures with the
  error, `list` counts, log paths excluded, and every method rejecting exactly
  as the raw storage does; verify unit tests drive it over a fake storage,
  including a write failure and a read of a missing file.
- [x] 2.4 Add `remove(path)` to `VaultStorage` (`src/vault/storage.ts`,
  `src/vault/fs.ts` via `removeEntry`, `src/demo/storage.ts`,
  `src/vault/fakeHandle.ts`); verify `npx vitest run src/vault/fs.test.ts` and
  `src/demo/storage.test.ts` cover removal and the missing-path rejection.

## 3. Events from the app layers

- [x] 3.1 `useIndex` takes an optional trace and records each `scan`
  (files, pages, ms) after a build publishes, plus `page-added`,
  `page-changed` (sizes before and after), and `page-vanished` by diffing
  against the previous index; verify `src/vault/useIndex.integration.test.ts`
  covers a refresh that observes an external edit, an external removal, and an
  added page.
- [x] 3.2 `App` creates the session per open folder (memoised on the raw storage
  and the gate, never for a demo vault), starts it with the version, folder name,
  and user agent, ends it on folder change, gate flip, and `pagehide`, and feeds
  the wrapped storage to `useIndex` and both savers; verify
  `src/App.integration.test.tsx` shows one trace file per folder session and a
  new file after a switch.
- [x] 3.3 `App` records `page-open`, one `edit` line per dirty burst, `flush`
  with the write count, and uncaught `error` / `unhandledrejection` from window
  listeners; verify integration tests cover the burst collapsing to one line,
  the flush on `visibilitychange`, and an uncaught error reaching the file.
- [x] 3.4 Verify the keystroke budget with a test that traces on and counts sink
  calls across N keystrokes (one `edit` per burst, no write, no flush), plus the
  existing sidebar/completion re-render counters staying unchanged.

## 4. Gate, docs, and the e2e

- [x] 4.1 Prove the off state: with the flag and the switch off, opening a
  folder and editing writes no `.folio/logs` entry and registers no trace
  listener; verify in `src/App.integration.test.tsx`.
- [x] 4.2 Set `VITE_TRACE=1` on the Playwright web server and add
  `tests/e2e/diagnostics.spec.ts`: turn the switch on, edit a page, and assert a
  trace file exists in the vault with the `session-start`, `write`, and `edit`
  lines; run `npm run test:e2e`.
- [x] 4.3 Write ADR-0035 (the trace as app-owned state, its format, retention,
  privacy limit, gate, and the return of `remove`), amend ADR-0030's status line,
  and add the row to `adr/README.md`; verify the table lists 0035.
- [x] 4.4 Document the switch and the trace in `README.md`, and the rail
  control in `DESIGN.md`; verify both name the same control and the same
  `.folio/logs/` path.
- [x] 4.5 Run the full gate: `npx oxlint --fix`, `npm run fmt`, the full vitest
  suite, `tsc -b`, `npx oxlint --deny-warnings --format=agent`, `npm run build`,
  and `npm run test:e2e`; then sweep with `npm run kill:dev`.
- [x] 4.6 Bump `version` in `package.json` to the next minor and commit the
  feature with the code, tests, docs, delta specs, and ADRs.

## Workflow follow-up

- Archive the change with `openspec archive`, syncing the main specs and moving
  the change directory.
- Bump `version` again for the archive commit (patch), then push `master` to
  `origin` and `nas`.
