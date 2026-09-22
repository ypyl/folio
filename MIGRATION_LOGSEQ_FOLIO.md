# Migrating a Logseq graph to Folio

Rules for the one-way copy from a Logseq graph (`C:\Users\ypyl\mega\logseq`) into a
Folio vault (`C:\Users\ypyl\mega\folio`). The Logseq folder is **read-only** in this
migration: nothing is moved, renamed, or deleted there.

These rules are implemented in two places that must stay in step: the in-app importer
(`src/vault/logseqImport.ts`, reached from the brand screen's **Import from Logseq**
action) and the command-line script (`scripts/migrate-logseq.mjs`). See ADR-0025 for why
the importer is one-way and input-only.

This document is the plan. Every rule below is either settled by Folio's ADRs/specs or
marked **DECIDE** (an open question for the owner). No file is copied until the DECIDE
rows are answered.

## 1. What Folio accepts (the constraints)

From `adr/` and `openspec/specs/`:

- Only `.md` files under `pages/` and `journals/` become pages. `assets/` files are
  assets, never pages (ADR-0022).
- A page's title is its **filename stem, verbatim** — no decoding, no slug (vault-index
  spec). References resolve to that stem, case-insensitively, after trimming.
- A path segment starting with `.` is hidden and ignored (also how `.folio/` stays out).
- A filename under `pages/` whose stem is a real `YYYY-MM-DD` day is ignored entirely
  (ADR-0019).
- Reference forms are exactly `#word` (`[\w-]+`: letters, digits, `_`, `-`) and
  `#[[name]]`. Plain `[[name]]` is **not** a reference (ADR-0012). A name containing `]`
  cannot be referenced at all.
- Asset links are **vault-root-relative** paths (`assets/x.png`), not `../assets/x.png`
  (ADR-0022, index spec).
- Journals are `journals/YYYY-MM-DD.md`.
- There is no block model, no properties, no task states, no queries, no macros, no
  block references (ADR-0009).

## 2. Folder mapping

| Logseq path | Folio path | Notes |
| --- | --- | --- |
| `pages/*.md` | `pages/*.md` | rename per §3 |
| `pages/journals/*.md` | `journals/*.md` | stray Folio artifacts inside the Logseq `pages/` folder (see §9) |
| `pages/.folio/` | skip | Folio meta, not Logseq content |
| `journals/YYYY_MM_DD.md` | `journals/YYYY-MM-DD.md` | underscore to hyphen |
| `assets/**` | `assets/**` | copy every file, referenced or not (ADR-0022 keeps orphans visible) |
| `draws/*.excalidraw` | `assets/*.excalidraw` | 2 files, unreferenced, preserved as assets |
| `whiteboards/*.edn` | `assets/*.edn` | 14 files, unreferenced, preserved as assets (Folio cannot render them) |
| `logseq/` (`config.edn`, `custom.css`, `bak/`) | skip | app config and backup history |

## 3. Page name normalization

Logseq stores a page's name in its filename using escapes that keep the name legal on
Windows. Folio derives the title from the same filename, so every name must end up as a
string that is (a) a legal Windows filename, (b) not hidden, (c) referenceable as
`#[[name]]` (no `]`), and (d) identical in the file name and in every reference to it.

Escapes found in this graph:

| On disk (Logseq) | Intended name | Count | Folio problem |
| --- | --- | --- | --- |
| `A___B` | `A/B` (namespace) | 7 files | `/` cannot exist in a filename; `#A/B` is not a reference |
| `%3A` | `:` | 31 | `:` illegal in Windows filenames |
| `%22` | `"` | 14 | `"` illegal in Windows filenames |
| `%7C` | `\|` | 1 | `\|` illegal in Windows filenames |
| `%3F` | `?` | 1 | `?` illegal in Windows filenames |
| `%3E` | `>` | 1 | `>` illegal in Windows filenames |
| `%2A` | `*` | 1 | `*` illegal in Windows filenames |
| `%2E` (leading) | leading `.` | 1 | leading `.` makes the file hidden |
| leading space | name starts with a space | 6 | references are trimmed, so they never resolve |
| `[` `]` | literal brackets | 13 files with `[`, 12 with `]` | `]` makes the name unreferenceable |

**Rule (settled):** strip leading/trailing whitespace from every name and every
reference target. The 6 space-prefixed page files are renamed without the space.

**Rule (settled, Option B - readable names):** replace each illegal, hidden, or
reference-breaking character with a legal replacement, in both the filename and every
reference:

| Char | Replacement |
| --- | --- |
| `/` | `-` |
| `:` | `-` |
| `"` | `'` |
| `\|` | `-` |
| `?` | `` (dropped) |
| `>` | `-` |
| `*` | `x` |
| leading `.` | dropped (`.NET interview question` -> `NET interview question`) |
| `]` | `)` |
| `[` | `(` |

A collision check runs before any rename; a collision aborts the migration and is
reported (no silent suffixing).

Rejected **Option A** (keep Logseq's `%XX` and `___`): the filename is the Folio page
title, so the encoding stays visible, and it does not even resolve the hidden (`%2E`),
leading-space, and `]` cases, which need renaming regardless.

## 4. Reference rewriting

HTML-like rewriting over page and journal bodies, in this order:

1. `[[Name]]` (plain wikilink) -> `#[[Name]]`. 53 occurrences.
2. `#[[Name]]` -> unchanged form, but `Name` is normalized by §3.
3. `#word` tags are **left exactly as written**, including names with `/` or `.`.
   Decided during implementation: every such `#` in this graph is a URL fragment
   (`https://github.com/x/y/blob/main/f.cs#L109`, `.../activationMenuBlade/#/AllFeatures`,
   `#50.80403/15.60136/14`), a heading (`##Answering`), JSON inside a code fence
   (`"@odata.type": "#Microsoft.Azure.Search.BM25Similarity"`), or prose pointing at a
   list item (`in #1.`). There is not one real prose tag with those characters, so the
   safest rule is to convert none. A false positive would silently corrupt a link or a
   code sample.
4. `[[Name]]` whose `Name` is a **human date** (`Apr 30th, 2025`) -> `#[[2025-04-30]]`
   (the journal day). 39 occurrences. Malformed non-dates are left as text and reported.
5. Block references `((uuid))` -> `#[[<page holding the block>]]`. 97 occurrences,
   all resolvable (81 distinct UUIDs, 0 dangling). The UUID's `id::` line identifies the
   owning file; that file's normalized page name (journal date or page stem) is the
   target. 89 become cross-page backlinks; the 8 same-page refs are kept as bare page
   references (Folio omits self-backlinks). Bare token, no `->` marker.
6. Every rewritten target must equal a `pages/` or `journals/` file stem from §3 (or be a
   deliberate dangling reference to a page not yet written). A report lists all targets
   with no file so they can be reviewed.

Not rewritten (no Folio equivalent; left as literal text and reported):

- Macros `{{video ...}}` - 9; `{{embed ...}}`, `{{query ...}}` - 0.
- `[text](url)` ordinary links - untouched.

> **DECIDE Q2:** For `((uuid))` block refs, keep the literal text, or delete it? There is
> no target to link to, so it is dead text either way. Recommend keep (lossless, and the
> surrounding sentence still reads).

## 5. Asset link rewriting

- `![alt](../assets/x.png)` -> `![alt](assets/x.png)`.
- `[label](../assets/x.pdf)` -> `[label](assets/x.pdf)`.
- 503 references, 468 distinct assets, all present. 69 assets are unreferenced and are
  still copied (the Assets section lists orphans by design, ADR-0022).
- Asset filenames are **not** renamed (they are bytes, not page names; a rename would
  break links and buys nothing). `%XX` inside an asset filename stays.
- A destination that does not resolve is reported, not dropped. `../assets/` is also
  rewritten when it appears outside a link, e.g. in a `file-path::` property value.
- **Trap:** five asset filenames contain parentheses
  (`Frankfurt_(Equality_as_a_Moral_Ideal)_1723959436393_0.pdf`, `CV_Fostiak_Vitalii_(1)_...`).
  Destinations must be scanned with balanced-paren Markdown semantics, not `[^)]+`, or
  those five links are truncated to a bad path.

## 6. Block and property cleanup

Logseq writes block metadata as `key:: value` continuation lines. Folio has no
properties, so these lines become visible body text unless handled:

| Property | Count | Rule |
| --- | --- | --- |
| `collapsed::` | 1811 | drop the line (pure UI state) |
| `id:: <uuid>` | 109 | drop the line (Logseq block id; its target page is captured by the `((uuid))` rewrite in §4.5) |
| `query-table::` | 1 | drop the line |
| `template::` | 3 | drop the line (Logseq template instance marker) |
| `title::` | 2 | drop only when the value equals the page's filename stem; otherwise keep |
| `:LOGBOOK:` / `:END:` wrapper lines | 226 | drop (drawer syntax only) |
| `CLOCK: (...) => ...` lines | 132 | keep as text (the time record) |
| `link::`, `file::`, `file-path::`, `cost::`, `balance::`, `time::`, `paid::`, `take::`, `tag::`, `tags::` | ~261 | keep the line verbatim as `key:: value` text |

Keeping the kept set is **required, not cosmetic**: `tags:: #llm #ai` is a reference, and
dropping it would break backlinks; `link::` is the payload of most of its bullets; the
ledger keys hold real data. The `::` signature is kept as-is (rejected: rewriting to
`key: value` - it buys nothing and loses fidelity; rejected: dropping all properties -
data loss).

## 7. Task markers and structure

- Task keywords become **page references** (settled). A `DONE`/`TODO`/`DOING`/`LATER`/
  `NOW` that is the first token of a list item is rewritten to `#KEYWORD`: `- DONE review
  book` -> `- #DONE review book`. This gives each state a page (`#DONE`, `#TODO`, ...)
  whose backlinks pane lists every page referencing it. Counts: DONE 1138, TODO 9, DOING
  4, LATER 2. `NOW` has no bullet-start occurrence (the one hit is `NOW()` in a SQL code
  block), so there is no `#NOW` page. Keywords that are not the first token, and keywords
  inside fenced code blocks, are left alone (e.g. a trailing `... LATER` stays text).
  `pages/TODO.md` and `pages/LATER.md` already exist, so `#TODO`/`#LATER` resolve to them
  and their backlinks collect the markers; `#DONE`/`#DOING` are new dangling pages,
  materialized on first open (ADR-0012).
- Logseq indents nested bullets with a **tab**; Folio's own vault uses two spaces. Tabs
  are valid CommonMark, but normalize to two spaces so the on-disk shape matches what the
  Folio editor writes back. This is a pure whitespace change and is applied to every
  body line.
- Bullet marker `-` is kept (ADR-0020: markers stay put).
- Line endings normalized to `\n`.

> **DECIDE Q4:** strip Logseq task keywords (`DONE`/`TODO`/...) or keep them as text?

## 8. Journals

- `journals/2024_07_02.md` -> `journals/2024-07-02.md`, 494 files.
- Content rules of §4-§7 apply to journal bodies too.
- A reference to a date always resolves to the journal day (ADR-0019), so human-date
  references of §4.4 land correctly.

## 9. Special cases found in this graph

1. **Nested Logseq-`pages/` Folio artifacts.** `pages/.folio/pins.md`,
   `pages/journals/2026-09-10.md`, `pages/journals/2026-09-11.md`. These are Folio
   files, not Logseq pages (someone opened `...\logseq\pages` as a vault). Rule: skip
   `pages/.folio/`; fold the nested journals into the target journals. `2026-09-10`
   merges with the existing empty root journal (`-\n-`) and adds `#saira` (the only
   record of that tag); `2026-09-11` becomes an empty journal.
2. **The same day twice.** `journals/2026_09_10.md` (two empty bullets) and
   `pages/journals/2026-09-10.md` (`#saira`) merge into one target journal file.
   `2026-09-11` exists only nested and becomes an empty journal. Covered by Q5.
3. **Malformed wikilinks.** 3 nested `[[[title](url)]]` and at least one `[[name]]]`.
   These stay as text and are reported.

## 10. Target vault

**Target (settled, Q7a): merge into `C:\Users\ypyl\mega\folio`.** Its 8 existing files
(`pages/claude-certifications.md`, 4 journals 2026-09-13..16, 3 assets, `.folio/pins.md`)
stay. Collisions were checked and there are none: target page names, journal dates, and
asset basenames are disjoint between the two vaults. Existing pins are kept (Logseq has
no pins). A collision check still runs before any write and aborts on a hit.

## 11. Process

1. ~~Answer the DECIDE rows.~~ All decided (see the table below).
2. Write `scripts/migrate-logseq.mjs` (Node 22, `node:fs`/`node:path` only, no deps):
   `node scripts/migrate-logseq.mjs <source> <target> [--apply]`. No personal paths
   hardcoded; source and target are arguments.
3. **Dry run first** (no `--apply`): emit the report - files to copy, renames, per-rule
   rewrite counts, dangling refs, name collisions, assets missing, self/broken links.
   Nothing is written.
4. Review the report.
5. Apply: `--apply` copies into the target, source untouched.
6. Validate: page/journal/asset counts match the report; every reference target resolves
   to a page, journal, or an intentional dangling name; `.folio/pins.md` untouched; open
   the vault in Folio and spot-check `#DONE`, `#TODO`, a renamed page, and an asset link.
7. Sweep dev servers with `npm run kill:dev` if a browser check was run.
8. Commit the doc and script with a patch version bump (`package.json`).

## Open questions

All resolved:

| # | Question | Decision |
| --- | --- | --- |
| Q1 | Name scheme: Option A (keep `%XX`/`___`) or Option B (readable replacements)? | **B - readable replacements** |
| Q2 | `((uuid))` block refs: keep, delete, or page ref? | **page ref to the owning page** |
| Q3 | User data properties: keep, convert, or drop? | **drop app noise, keep user data as `key:: value`** |
| Q4 | Strip `DONE`/`TODO`/... keywords or keep? | **convert to `#KEY` page references** |
| Q4b | `:LOGBOOK:`/`CLOCK:` drawers: keep, tidy, or drop? | **drop wrapper, keep `CLOCK:` lines** |
| Q5 | Nested `pages/.folio` + `pages/journals`: skip or fold in? | **fold journals, skip `.folio`** |
| Q6 | `draws/` + `whiteboards/`: copy to `assets/` or skip? | **copy both** |
| Q7 | Target: merge into `mega/folio`, or a fresh folder? | **merge** |
| Q8 | Commit the migration script, or run throwaway? | **commit `scripts/migrate-logseq.mjs`** |
