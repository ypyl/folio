## Context

See proposal.md for motivation. The relevant state today:

- Two places turn a reference name into a path, both in `src/App.tsx`: `handleOpenReference` (line ~142, the badge click) and the Forwardlinks row builder (line ~356). Both do `graph.byName.get(name.toLowerCase()) ?? \`pages/${name}.md\``.
- The byName miss is what produces the bug. When `journals/2026-09-16.md` exists, `fold()` maps the date name to it, so the reference already works; when it does not, the fallback invents a `pages/` path.
- `isPagePath` in `src/vault/index.ts` decides what becomes a page. It already excludes hidden segments and everything outside `pages/` and `journals/`.
- Links-pane rows carry a `materialized` flag that only dims the row (`MetaPanel`); navigation is path-generic.
- Opening a day with no file goes through `pendingBlank`, keyed on `draft.saved === ''`. The file materializes on first save.

Constraints: navigation must not write (proposal Q5), filesystem access stays behind `VaultStorage` (ADR-0003), and knowledge-management logic stays out of the editor (ADR-0010). AGENTS.md's keystroke budget applies: no new per-keystroke work.

## Goals / Non-Goals

**Goals:**

- One rule for where a date name lives, applied by both the index and the app, from one shared predicate.
- No new app state, no new write path, and no change to the unmaterialized-page machinery.

**Non-Goals:**

- No migration, no repair, no read-through for files already under `pages/`.
- No eager creation, no empty-file cleanup.
- No completion or picker support for dates that have no file.

## Decisions

**D1 - One predicate, in the vault layer.** Add to `src/vault/index.ts`, beside `journalDate`/`localDayString`:

- `journalDayName(name: string): string | null` - the date string when `name` is a valid calendar date in zero-padded `YYYY-MM-DD` form, else null.
- `journalDayPath(name: string): string` - `journals/<name>.md`.

Validity is checked by component, not by `Date` parsing. `new Date('2026-09-16')` parses as UTC and `new Date(26, 9, 16)` shifts the year (years 0-99 map to 1900+), so the check reads the parts, enforces month 1-12 and day within that month's length (with a leap-year rule), and rejects anything else. This is the whole reason the predicate cannot be a regex: `2026-13-45` is the wrong shape to accept.

**D2 - One resolver, used by both sites.** Add `resolveReferencePath(name, byName)` to the same module:

```
if (journalDayName(name)) return journalDayPath(name)
return byName.get(name.toLowerCase()) ?? `pages/${name}.md`
```

Both `App.tsx` sites call it. No normalization: `2026-9-6` stays a page name, because a normalized path would not match the reference text and backlinks fold by name.

**D3 - `isPagePath` excludes date-named files under `pages/`.** Reject a path when it starts with `pages/` and its stem satisfies `journalDayName`. This is required, not cosmetic: without it `fold()` would still put `pages/2026-09-16.md` in `byName` under the date name, `resolveReferencePath` would return it, and the bug would survive the D2 fix. It also removes the file from the sidebar, search, and backlink sources in one place.

`isPagePath` is shared with `parsePins`, so a pin naming such a path is silently dropped. That is the existing self-healing behavior for pins that name no page, so no extra handling.

**D4 - Navigation and materialization are untouched.** The resolver returns a `journals/` path, so the existing `pendingBlank`/`drafts.open` path runs unchanged: blank day, cell marked open, file on first save. The date's Forwardlinks row is dimmed only when the file is absent, which the existing `materialized` flag already computes.

Alternatives rejected:

- **Fix only the `App.tsx` fallback.** Leaves the stray `pages/` file in `byName` and listed as a page; the reference would still resolve to it whenever the date name hits the map.
- **Repair the stray file** (move it to `journals/`, or seed the journal day from it). Destructive or a permanent cross-path rule, for what is a one-time accident (proposal Q4).
- **Eager creation.** Would put a write on navigation, including the boot auto-open, and add a second writer racing the debounced saver (proposal Q5).
- **A regex-only predicate.** Accepts `2026-13-45` and creates journal entries the calendar cannot place.

## Risks / Trade-offs

- [A file the user can see in Explorer becomes invisible in Folio] -> Accepted (proposal Q4). It is the same class of carve-out as `assets/` and `.folio/`; ADR-0019 records that it is deliberate and that the file stays untouched on disk.
- [`pages/` can no longer hold a date-named page] -> Accepted; recorded in the page-references delta and ADR-0019. No migration compatibility is owed (ADR-0012, AGENTS.md).
- [Two code sites can drift] -> Both call the one resolver in D2; the spec's scenarios cover the badge and the Forwardlinks row, which are separate tests.
- [`journals/<invalid date>.md` written by another tool still matches `journalDate`'s shape-only regex and can render as a misplaced calendar cell] -> Pre-existing and unrelated; the change neither creates nor worsens it, and fixing it is a separate proposal.
- [Cost] -> `isPagePath` gains one regex plus a range check per scanned file, on scans only. Nothing is added to the keystroke path: resolution runs on navigation and graph rebuild, and no derived data is rebuilt per keystroke.

## Migration Plan

None. No data is read, written, or moved by the change, and rollback is the reverse diff. Bump `version` in `package.json` (patch) with the commit, per AGENTS.md.
