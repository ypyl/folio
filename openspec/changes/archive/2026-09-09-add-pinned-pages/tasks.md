## 1. Pins file parsing and index plumbing

- [x] 1.1 Add `parsePins(content: string): string[]` to `src/vault/index.ts`: per line, trim, strip a leading `- `, keep only lines that are valid page paths (`isPagePath`), ignore everything else (header `# ...`, blank lines, journal or asset paths), preserving order; verify unit tests cover a real pins file (header + list), a bare-path hand-edit, junk lines ignored, and an empty file yielding `[]`
- [x] 1.2 Extend `buildIndex` to read `.folio/pins.md` into `VaultIndex.pins: string[]` with a guarded read (missing file ⇒ `[]`, not an error — `VaultStorage.read` rejects on missing per ADR-0013) and track the meta file's mtime in the same `snapshot`; verify with fake-handle storage that a missing file yields `[]`, an existing file yields the parsed order, and an incremental refresh re-reads pins only when the meta file's mtime changed (external edit picked up)
- [x] 1.3 Add `upsertPins(storage, current, pins)` mirroring `upsertPage`: write the rendered pins file (header + `- path` lines), stat, update in-memory pins and the snapshot mtime, non-optimistic (failed write leaves index and disk consistent); verify a write-through round-trip on the fake storage and that a failed write preserves the previous pins

## 2. Page last-modified time

- [x] 2.1 Add `lastModified: number` to `IndexPage` in `src/vault/index.ts` and fill it in `buildIndex` (from the stat already taken), `upsertPage` (from the post-write stat), and `carryOver` (carried pages keep their last-modified); verify index tests: a scanned page carries the fake file's `lastModified`, a upserted page carries the post-write value, and a carried (unchanged) page preserves its original value

## 3. Pins surface in useIndex

- [x] 3.1 Extend `useIndex` to return `pins: string[]` (from the built index) and a stable `togglePin(path)` that flips membership, persists via `upsertPins`, and resolves by path; verify with a `useIndex` test: pin then unpin round-trips through the fake storage, the returned pins refresh, and `togglePin` is referentially stable across renders

## 4. Composition-layer ordering

- [x] 4.1 Add a pure ordering helper (unit-tested, e.g. next to `App` or in `src/vault/index.ts`): given pages and pins, partition into pinned rows in pin-file order followed by remaining rows by `lastModified` desc with path-ascending tiebreak; verify tests cover pin-first ordering, edit-order descending, the tiebreak, and an empty pins list falling back to pure edit order
- [x] 4.2 Wire `App` to use the helper for the `pages` array passed to `Sidebar` and pass the pinned set down so rows can render stars; verify the running app shows a pinned page first with a star and an unpinned page among the edit-ordered rows

## 5. Sidebar rows and star affordance

- [x] 5.1 Restructure the Pages row in `Sidebar.tsx` from a single button into a flex container: the existing nav button keeps the row's look, active marking, and navigation; add a separate compact star button beside it (`aria-pressed`, `aria-label`); update `Sidebar.test.tsx` and verify clicking the nav button navigates while activating the star does not
- [x] 5.2 Add the star glyph (inline SVG: filled = pinned, outline = unpinned), the hover/focus-visible reveal of the outline star on unpinned rows, and pinned-star placement styled per Kami tokens (`--brand`/`--stone`) in `Sidebar.module.css`; verify in the running app that pinned rows show a filled star, hover reveals the outline star, and keyboard focus reaches the star button; check the treatment against DESIGN.md
- [x] 5.3 Cover the end-to-end ribbon with a sidebar/App test: pinning a file-backed page from its row moves it to the top of the Pages list with a filled star, and unpinning drops it back into edit order (pinned-pages and static-navigation scenarios)

## 6. Docs and build

- [x] 6.1 Write `adr/0015-in-vault-app-meta.md` (Status Accepted, Date): the `.folio/` directory is app-owned vault state — dot-named, invisible to the page index and search, always rebuildable by scanning, per-vault; record the carve-out/clarification relative to ADR-0001 and add the row to `adr/README.md`; verify it cross-references ADR-0001 and reads as a self-contained MADR
- [x] 6.2 Add a short DESIGN.md note on the star glyph and row iconography (filled/outline treatment, hover reveal, Kami token colors); verify tokens match the design language and no second chromatic color appears
- [x] 6.3 Promote PLAN.md's two "Later ideas" bullets (favorites; ordering by created/edited) into one numbered task 16 describing pinned pages (folder-file pins, star rows, pinned-first then edit-desc ordering) as committed but not yet built, removing them from the Later ideas list
- [x] 6.4 Run `npm run lint` and `npm run build`; confirm the production build passes and the full test suite is green