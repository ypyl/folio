## Why

Pages currently live at the vault root alongside journals, assets, and any other files the user drops in. This makes it hard to tell what is a page and what is not, and prevents Folio from owning a clean namespace for its own pages. Moving pages into a dedicated `pages/` subfolder gives the vault a clear layout: `pages/` for user notes, `journals/` for daily entries, `assets/` for attachments, `.folio/` for internal state. The `.folio/` directory already exists (ADR-0015) for pins; this change extends the convention to pages.

## What Changes

- **BREAKING**: Regular pages are now stored under `pages/` instead of the vault root. A page that was `MyPage.md` becomes `pages/MyPage.md`. Journal entries remain at `journals/YYYY-MM-DD.md` (unchanged).
- The index scan changes from "any `.md` file at any depth" to "files under `pages/` and `journals/` only". Root-level `.md` files are no longer indexed as pages.
- Unmaterialized pages (links to non-existent pages) resolve to `pages/name.md` instead of `name.md`.
- The `.folio/` directory is already excluded from indexing (hidden segment). No change needed there.
- Existing vaults with root-level `.md` files will stop showing those pages. Users must move them into `pages/` manually (no auto-migration).

## Capabilities

### Modified Capabilities

- `vault-index`: The page-scan rule changes from "any `.md` file at any depth, no hidden segments, not under `assets/`" to "`pages/*.md` and `journals/*.md` only". The `kind` classification (`page` vs `journal`) is now derived from whether the path starts with `pages/` or `journals/`, rather than "starts with `journals/` = journal, everything else = page".
- `static-navigation`: Unmaterialized pages (links to non-existent targets) resolve to `pages/name.md` instead of `name.md`. The "Today" journal path is unchanged.

### New Capabilities

None.

## Impact

- **Code**: `src/vault/index.ts` (isPagePath, kindOf, buildIndex scan), `src/App.tsx` (handleOpenReference, forwardlink path construction).
- **Tests**: All index tests that use root-level page paths (e.g., `a.md`, `Welcome.md`) must be updated to use `pages/` paths.
- **Docs**: ADR-0001 may need a note about the `pages/` convention. No new ADR needed since ADR-0015 already establishes `.folio/` conventions and the layout is a natural extension.
- **Existing vaults**: Users with root-level `.md` files will see them disappear from the sidebar. No auto-migration; this is a new app with no backward-compatibility obligation (ADR-0012).

## Non-goals

- Auto-migrating existing vaults (moving root `.md` files into `pages/`).
- Changing the journals layout (stays at `journals/`).
- Changing the `.folio/` internal structure.
- Adding folder-based page organization within `pages/` (e.g., `pages/projects/` subfolders) — pages are flat inside `pages/`.
