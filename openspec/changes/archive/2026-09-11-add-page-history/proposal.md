## Why

Navigation in Folio is one-way. Page rows, calendar days, backlinks, forwardlinks, search results, and reference badges all replace the open page with no way back: once you follow a link to look something up, the page you were reading is gone unless you find it again by hand. The app already knows where you just were; it simply does not remember it.

## What Changes

- Add a **History** section to the left sidebar, after Pages, open by default. It lists the pages opened this session, most recent first, and clicking a row returns to that page.
- Record the trail as a **de-duped stack with a cap of 20**: opening a page already in the trail moves it to the top instead of adding a second row.
- The section shows **only pages you have been to**, excluding the page currently open, and shows empty-state copy when there is nothing to go back to.
- The trail is **session-only and per-vault**: it lives in memory, never touches disk, and is cleared when the active folder changes.
- **Change to the shell contract**: the sidebar is no longer exactly two sections. The `ui-shell` requirement that fixes it at Journal and Pages is amended to three, and the loading-placeholder requirement stays limited to Journal and Pages, since History has nothing to record while the index builds.
- **Keep the feature off the keystroke path**: the Pages list currently re-creates a row element per page on every keystroke, because `Sidebar` is not memoized and its select handler is a fresh closure each render. This change memoizes the sidebar, stabilizes that handler, and records before/after measurements (AGENTS.md: anything scaling with vault size carries its measurement).

## Capabilities

### New Capabilities

- `page-history`: the session trail of opened pages — what counts as an open, stack order and de-dupe, the cap, the folder-switch reset, and the section's rows and empty state.

### Modified Capabilities

- `ui-shell`: the sidebar requirement changes from exactly two sections (Journal, Pages) to three (Journal, Pages, History), with History open by default; the loading-placeholder requirement explicitly limits sidebar placeholders to Journal and Pages.

## Non-goals

- **No persistence.** History is not written to `.folio/`, IndexedDB, or `sessionStorage`. It does not survive a reload, and no new vault meta file exists, so ADR-0015 is untouched.
- **No browser history integration.** No `pushState`, no URL routing, no back-button behavior; Folio still has no router.
- **No back/forward controls or chords** (`Mod-[`, `Alt-Left`, arrow controls). The trail is click-only.
- **No per-folder retained trails.** Switching folders clears the trail; the app does not keep one per folder.
- **No timestamps, visit counts, or merging with the Pages list's last-modified ordering**, and no clear-all control.
- **No new ADR.** Nothing durable is decided here; the rejected alternatives are recorded in `design.md`.

## Impact

- `src/App.tsx`: the trail state, one effect keyed on the open page, the folder-change reset, and a stable select handler.
- New module for the pure push helper (trail order, de-dupe, cap) plus its test.
- `src/components/Sidebar.tsx` and its CSS module: the History section, its rows, and its empty state.
- `src/vault/useIndex.ts`: a constant empty pins array, so a memoized sidebar does not see a new prop identity while the index builds.
- Specs: new `page-history` capability; amended `ui-shell`.
- Related ADRs: ADR-0001 (nothing new lands in the vault), ADR-0004 (disposable in-memory derived data), ADR-0005 and ADR-0006 (keep the shell and the feature set small).
- Measurement: keystroke render cost in a large vault, before and after the memo, recorded in `design.md`.
