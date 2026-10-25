# Folio

A lightweight, local-first alternative to Logseq. Your Markdown folder is the database; the app is just a UI and index over it.

Live build: <https://ypyl.github.io/folio/> (Chromium browsers only — it needs the File System Access API).

Every push to `master` builds with `GITHUB_PAGES=1` (base `/folio/`) and deploys to GitHub Pages via `.github/workflows/deploy.yml`. Run `npm run dev` locally for the root base.

## Features

- Open one or more local Markdown folders (vaults) directly from the browser; the folder is the database
- Markdown editing with a live preview: images, tables, and references render inline while the text stays the source; auto-save and syntax-highlighted code blocks
- Page references (`#word`, `#[[Page]]`) with backlinks and forwardlinks, plus inline completion for references and link destinations
- Daily journal pages with a calendar
- Whiteboards: `.excalidraw` boards under `boards/`, referenced with `#!` tokens and edited in the pane
- Assets: drag, drop, or paste files into a page; browse them in the sidebar and open them from a page
- Full-text search over pages and journals, and by name over assets and boards, with operators that lead with the kind or field you name (see [Searching](#searching))
- Favorites, back/forward history, and a status bar: the open page's name in the bar reveals its row in Files, creating the page first when it has no file yet, and a journal day's name shows and focuses that day in the calendar
- Reminders: set from the Journal calendar's day menu, scheduled by a rule (`once`, `daily`, `weekly`, `monthly`, `yearly`) in `.folio/reminders.md`, and written into the day's note when it comes (see [Reminders](#reminders))
- A guided tour of the shell, from the folder rail or the brand screen
- One-way import of an existing Logseq graph (pages, journals, and assets), merged without overwriting
- Collapsible side panes; a PWA that installs and works offline

## Searching

Open the spotlight with `Ctrl/Cmd+P`, `Ctrl/Cmd+K`, or the folder rail's search
icon. The query splits into terms and every term must match; a term of three or
more characters matches literally or fuzzily, a shorter one matches a whole word
only.

Five operators reorder the results. Type one as a token anywhere in the query
(text after the colon is an ordinary term) and the dropdown and the full results
view lead with what it names:

| Operator | Leads with |
| --- | --- |
| `page:` | matching pages |
| `journal:` | matching journal days |
| `board:` | matching boards |
| `assets:` | matching files |
| `title:` | matches in a title or name, under a **Names** heading, ahead of content matches |

An operator reorders, it never hides a result, and the first operator in a query
wins. With an empty query the spotlight lists the five operators to choose from.

## Reminders

A reminder is a page you reference from a journal day. Set one from the Journal
calendar: open the page you want to be reminded about, right-click any day, and
choose a recurrence. The menu offers `Once, on this day`, `Every day`,
`Every week`, `Every month`, and `Every year`. `Once, on this day` is unavailable
for a day that has already passed, since it could never fire; the recurrences
stay available, because they match from their anchor onward. A page has one
reminder: choosing another for a page that already has one asks first, then
replaces it. To clear a page's reminder, right-click its row in the Files
listing: `Remove reminder` sits between `Favorite` and `Present`, with the
schedule it deletes beneath it as a small gray line (`every day from October 6,
2026`).

The rule lives in `.folio/reminders.md`:

```markdown
# Reminders - order is reminder order

- yearly 2026-04-12 #[[Ana birthday]]
- monthly 2026-10-01 #[[Pay rent]]
- daily 2026-10-16 #[[Take pills]]
```

When you open a journal day that a rule matches, the app writes one reference
line into that day's note. The line is the occurrence and the record, and the
page's backlinks become the history of every day it was referenced. Removing a
reminder deletes only its rule: the page and the written lines stay.

A month or year that does not hold the anchor day (the 31st in a short month,
February 29 in a common year) fires nothing rather than moving to another day.
The badge on the installed app's icon counts the open day's reminders. A reminder
only surfaces while the app is open: there is no server to wake a closed tab.

The line is appended at the end of the day's note and the app leaves your caret
and scroll position alone, so opening a long note still reads from where you left
it. A page that holds a rule carries a small bell in the Files listing, in the
same badge slot the board and file rows use for their kind letters.

## Cleaning up the vault

Folio never deletes files. It edits them, so clearing a page in the app can leave an
empty file behind, but the file itself stays in the folder. Everything else,
deleting, renaming, moving, or emptying folders, is yours to do in your file
manager.

What a vault holds:

| Path | Holds |
| --- | --- |
| `pages/` | one `.md` file per page, optionally in subfolders |
| `journals/` | one `.md` file per day, named `YYYY-MM-DD.md` |
| `assets/` | dropped, pasted, and imported files, whatever the extension |
| `boards/` | `.excalidraw` whiteboards, referenced by `#!` tokens |
| `.folio/` | the app's own bookkeeping: `pins.md` (pinned pages), `reminders.md` (reminder rules), and `imports.md` (the Logseq import ledger) |
| anything else | ignored by Folio; a Markdown file is a page only under `pages/` or `journals/` |

So cleanup is plain file deletion:

- **Page or journal day**: delete its `.md` file. References to it stop resolving and
  backlinks to it go with it; nothing else is touched.
- **Attachment**: delete the file from `assets/`. It leaves the Assets listing and any
  page that named it.
- **Whiteboard**: delete the `.excalidraw` file from `boards/`. The `#!` token stays in the
  referring page and simply stops resolving.
- **Pins**: delete `.folio/pins.md`.
- **Reminders**: delete `.folio/reminders.md`. The pages and the journal lines that
  reference them stay; only the schedule goes.
- **Logseq import ledger**: delete `.folio/imports.md` to make a folder importable again;
  the next run then writes those files once more, appending to what a previous run left.

Folio picks deletions up when it rescans: switching back to its tab, or reopening the
folder, re-lists the vault, so a file you deleted drops out of the index and one you
dropped in by hand appears.

## Tech Stack

- React 19 + TypeScript, built with Vite 8
- File System Access API (Chromium-first: Chrome, Edge, Brave)
- [CodeMirror 6](https://codemirror.net/) for the page surface: the Markdown text, with inline images, tables, and references rendered as view-only decorations (ADR-0029)
- [Excalidraw](https://excalidraw.com/) for whiteboards
- [Fuse.js](https://www.fusejs.io/) for search
- `vite-plugin-pwa` for offline and install
- Vitest for tests, oxlint/oxfmt for lint and format
- No backend and no application database

## Getting Started

```bash
npm install
npm run dev
```

## Documentation

- [adr/README.md](adr/README.md) — architecture decision records
- [openspec/specs/](openspec/specs/) — behavior specifications
- [DESIGN.md](DESIGN.md) — the design language
- [AGENTS.md](AGENTS.md) — how the project is built and kept small

## Importing from Logseq

With no folder open, the brand screen offers **Import from Logseq**. Pick the Logseq
folder (read-only) and a destination folder, and Folio translates the graph into its own
Markdown rules and merges it in: new files are written, a file the destination already
holds is appended to, and an existing asset is left alone. Progress is shown as it runs,
and the result summary reports what was written, merged, and skipped.

Importing several graphs into one vault is the intended use: import each in turn and
their pages and journals combine. A hidden `.folio/imports.md` ledger records every
source file already imported, so re-running an import — including resuming after a
partial failure — appends only what is new and never duplicates. Importing the same
folder twice is a no-op.

The rule set is documented in [MIGRATION_LOGSEQ_FOLIO.md](MIGRATION_LOGSEQ_FOLIO.md),
implemented in the app, and recorded as one-way and input-only in
[ADR-0025](adr/0025-logseq-import-is-one-way-and-input-only.md).

## License

MIT