## Context

The vault currently indexes every `.md` file at any depth (excluding `assets/` and hidden paths). Pages and journals both live at the vault root or in subdirectories. ADR-0015 established `.folio/` for app-owned state. This change introduces a `pages/` subfolder as the canonical home for regular pages, while journals stay at `journals/`.

## Goals / Non-Goals

**Goals:**
- Pages live under `pages/`, journals under `journals/`, internal state under `.folio/`.
- The vault layout is clear: no ambiguity about what is a page.
- Unmaterialized pages resolve to `pages/name.md`.

**Non-Goals:**
- Auto-migrating existing vaults.
- Subfolder organization within `pages/` (flat is fine for now).
- Changing the journals layout.

## Decisions

### D1: Page paths use a `pages/` prefix

All page paths become `pages/name.md` instead of `name.md`. This is a convention enforced by `isPagePath`, not by the storage layer.

**Alternatives considered:**
- Root-level with a naming convention (e.g., `_page-name.md`): rejected because it clutters the root and conflicts with user files.
- Configurable page directory: rejected as premature complexity (ADR-0006).

### D2: `isPagePath` becomes prefix-based

`isPagePath` changes from "any `.md` file not in `assets/` or hidden" to "starts with `pages/` or `journals/`, ends in `.md`, no hidden segments". This is the single gate for the index scan.

The `assets/` exclusion is no longer needed in `isPagePath` because files under `assets/` don't start with `pages/` or `journals/`. It can be removed from the function.

### D3: `kindOf` stays prefix-based

`kindOf` already checks `path.startsWith('journals/')`. Pages now start with `pages/`, so the classification is:
- `journals/*` → `'journal'`
- `pages/*` → `'page'`

No other paths reach `kindOf` because `isPagePath` filters them out.

### D4: Unmaterialized page paths get the `pages/` prefix

When following a reference to a non-existent page, the path becomes `pages/name.md`. This applies in:
- `App.tsx` `handleOpenReference`: `${target}.md` → `pages/${target}.md`
- `App.tsx` forwardlink resolution: `${l.target}.md` → `pages/${l.target}.md`

Journal paths (`journals/YYYY-MM-DD.md`) are unchanged.

### D5: The `stem` function is unchanged

`stem('pages/MyPage.md')` already returns `MyPage` — it strips the last `/` segment and the `.md` extension. No change needed.

### D6: Pins reference `pages/` paths

The `.folio/pins.md` file stores paths like `pages/MyPage.md`. The `isPagePath` check in `parsePins` already validates paths; with the new `isPagePath`, only `pages/` and `journals/` paths are valid pins. Existing pins files with root-level paths will produce empty pin lists (the paths fail `isPagePath`), which is self-healing.

### D7: The `buildIndex` scan is unchanged

`buildIndex` calls `storage.list('')` to get all files, then filters with `isPagePath`. The filter now only accepts `pages/` and `journals/` paths. No change to the scan loop itself.

## Risks / Trade-offs

- **Existing vaults break**: Root-level `.md` files disappear from the sidebar. This is intentional — Folio is a new app with no migration obligation (ADR-0012). Users must move files manually.
- **Pins with old paths become stale**: Pins referencing `name.md` (root) will not resolve. Self-healing: they simply don't show in the sidebar. Users can re-pin.
- **Deeper paths in `pages/`**: A page at `pages/projects/ideas.md` has title `ideas`, same as `pages/ideas.md`. Case-collision resolution (first-by-path) handles this. No change needed.
