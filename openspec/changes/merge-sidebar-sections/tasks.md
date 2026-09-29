## 1. Merged row model (App)

- [x] 1.1 Define the sidebar row shape in `App.tsx` — `{ kind: 'page' | 'board' | 'asset'; path: string; label: string; pinned?: boolean }` — and build the merged, ordered array from `pages`, `graph.boards`, and `graph.assets` (pages via `orderPages`, then boards path order, then assets path order), verifying with a unit test over a mixed fixture that order is pages, then boards, then assets.
- [x] 1.2 Memoize the merged array on `graph`/`pins` identity and pass it to `Sidebar` as `rows`, keeping `activePath` and `journalEntries`; verify by test that `Sidebar` renders solely from `rows` and performs no sort of its own.

## 2. Sidebar becomes one Files section

- [x] 2.1 Replace the Pages, Boards, and Assets `Accordion`s with a single `Files` section (`defaultOpen`, shared remaining height); verify `Sidebar.test.tsx` shows exactly two summaries — Journal and Files — and that journal behavior is unchanged.
- [x] 2.2 Collapse the three measured bodies into one: one body ref, one `ListView`, one `measureList` call, one `windowPieces` pass, and the `ResizeObserver` watching two bands; verify the existing windowing and scroll tests pass against the single body.
- [x] 2.3 Pass the active entry's index across all kinds as `keep` to `windowPieces`; verify a test where an open board far down the list has its row rendered and marked active.

## 3. Row rendering and badges

- [x] 3.1 Render page rows as today — pin marker, drag source when referenceable, active marking, no kind badge; verify a page row carries no badge and remains draggable.
- [x] 3.2 Render board rows with a leading `b` badge and active marking, activating `onOpenBoard`; verify a board row opens the board and shows the badge.
- [x] 3.3 Render asset rows with a leading `a` badge, draggable, activating `onOpenAsset`; verify an asset row opens the file, is draggable, and shows the badge.
- [x] 3.4 Style the badges from Kami tokens per `DESIGN.md` (chip/brand treatment, presentational, no layout shift); verify the badge renders as a non-interactive span and passes the palette check.

## 4. Loading and empty states

- [x] 4.1 Show the loading skeleton in the single Files body in place of the listing rows; verify the sidebar loading-placeholder test passes.
- [x] 4.2 Show empty-state copy only when the Files listing holds no rows at all, dropping "No boards yet." and "No assets yet."; verify an empty vault shows the copy and a pages-only vault shows none.
- [x] 4.3 Update the scrollbar-gutter region from the three former bodies to the single Files body; verify the scroll-region test passes and the reserved lane is present before overflow.

## 5. Tests

- [x] 5.1 Update `App.test.tsx` sidebar assertions from three sections to the single Files listing, and verify the full suite passes.
- [x] 5.2 Add a test asserting the merged order: pinned pages, then pages by last-modified, then boards in path order, then assets in path order.
- [x] 5.3 Add a test asserting the `b` and `a` badges appear on board and asset rows and not on page rows.

## 6. Finish

- [x] 6.1 Run `npx oxlint --fix`, then `npm run fmt`, and confirm clean with `npx oxlint --deny-warnings --format=agent`.
- [x] 6.2 Run `npm run test` and `npm run build`; both pass.
- [x] 6.3 Bump `version` in `package.json` as part of the commit (MINOR — a new user-facing capability).
