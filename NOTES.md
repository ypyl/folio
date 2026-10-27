# Notes

Open and closed questions that are not shipped work: an undecided backlog, work decided
against, and costs measured and accepted as they are. `openspec/changes/archive/` is the
record of what was built, `adr/` is the record of why, and this file holds everything
still open or deliberately closed.

Nothing here is scheduled. An entry becomes a change only when we commit to building it,
and it then runs through OpenSpec (`/opsx-propose` first). No entry is a promise or a
date.

This file replaced `PLAN.md`, which carried a numbered record of shipped tasks closed at
task 41. That history is in `git log` and the archive, so the list is gone rather than
kept as a second copy.

## Ideas

Undecided, deliberately not scheduled. Revisit when a change touches their area; each
becomes an OpenSpec change only when we commit to building it.

- **Orphan asset cleanup** — scan `assets/`, find files no page references, offer removal
  ("remove unreferenced attachments").
- **Vault integrity check** — the folder is the database, so the filesystem can change
  under the app: rename `assets/Q3 report.pdf` outside Folio and the page's
  `[Q3 report](assets/Q3%20report.pdf)` points at nothing, silently, because nothing
  re-reads the page. One side is already handled — a file that vanishes drops out of the
  sidebar and Forwardlinks, which read `Graph.files` — but the page keeps a dangling
  destination the app never reports. Detection is nearly free: the scan already holds
  every path and every page's Markdown destinations, so a broken reference is a set
  difference, computed per scan and never per keystroke. The open question is what to do
  with a finding: report only (a "missing" state on the link, plus a count somewhere), or
  repair by rewriting the reference — which needs a rename mapping the app cannot see,
  since the folder keeps no history and a rename arrives as a delete plus an add, so an
  automatic fix means guessing the new path and a manual fix means a picker like the one
  that completes a link destination. Decide the scope too: asset paths only, or page and
  board references as well, and whether it stays a batch scan or becomes a banner when the
  open page holds a broken link. This does not reopen **Reference-aware asset deletion**
  below: it reports and repairs, it never deletes.
- **Unlinked references** — pages whose plain body mentions a page name without a link
  token (Logseq's third list). Needs its own matching semantics (word boundary, case, dash
  handling) and dedup against real backlinks; deliberately deferred from the links pane to
  keep that change about the actual link graph.
- **Non-date journal files in the calendar** — files under `journals/` that aren't
  `YYYY-MM-DD` (e.g. `journals/notes.md`) render no calendar cell; the calendar replaced
  the day list that used to surface them. Decide the escape hatch (a small "other journal
  files" list) when the vault actually has such files.
- **First-run guide** — **partly shipped**: an on-demand tour now points at each pane from
  the rail's `?`, so the main components are explained when asked for. What remains here
  is the rest of a new user's first run: the main flow (open a folder; the folder is the
  database; pages and journal days are plain `.md` files; `#word` and `#[[Page]]` link
  them; search finds them) is still nowhere stated, and the guide still does not appear on
  its own. The questions to settle first: whether it becomes a one-time overlay, a Help
  band in the right panel beside the shortcuts reference, or a bundled sample vault; and
  where a dismissal lives, since the app keeps no settings store and only the vault may
  hold state — an in-memory flag forgets per reload, and a file under `.folio/` (the pins
  precedent, ADR-0015) writes to the user's folder.

### Jotted during other work

Notes left in the list with no decision and no estimate. Each names the question to answer
before it can be built.

- **Version marker by the file path** — jotted during the status-bar work as "start adding
  version -> near the title badge": show some version or revision marker beside the
  breadcrumb. The build version now sits in the status bar (`v<version>`, beside the file
  count), so what is left of this note is its real question: what a version means for a
  plain Markdown file, as opposed to for the build.
- **Move selected text to a new page** — jotted as "allow to select text on the page and
  move it to a new page". The question to settle first is what stays behind in the
  original: a link, a heading, or nothing.
- **Clicking past a reference on its own line** — jotted as "when reference is only one in
  line, even clicking on the end of the line -> navigates to the page referenced by link".
  The note does not say whether that is the bug or the intent, so the first step is
  deciding which way it should go.

## Decided against

Won't do, with the date and the reason, so the question stays closed.

- **Reference-aware asset deletion** — **won't do** (decided 2026-09-10). Deleting a link
  stays non-destructive: the asset remains on disk, and the app never scans references to
  decide whether to delete a file. No reference-aware cleanup and no deletion prompts; the
  safe default is the decision, not an open question.
- **Page size limits** — **won't do** (decided 2026-09-11). No file-size cap and no
  degraded mode for large files: they are hypothetical, and any threshold either nags a
  legitimate file or never fires. A sluggish page is one the user can split in any text
  editor, which is the point of a folder of plain Markdown. Revisit only on a real stall,
  and then as crash prevention, not a limit. If it ever happens, the unit is top-level
  blocks (what the DOM pays for), not bytes.
- **Trimming the integration suite to match the e2e specs** — **won't do** (decided
  2026-10-15). 486 jsdom integration tests over the whole `<App/>` dominate the run, and
  search, whiteboards, the compact shell, the tour, and history also have Playwright specs.
  The tests stay: the e2e overlap is topical rather than line-for-line, and the integration
  suite is the only place the pre-index states, the failure branches, and the "stays off
  the typing path" assertions are reachable. The cost is local runtime, not correctness,
  and deleting green tests to save it is a bad trade.
- **A batched Logseq import ledger** — **won't do unless an import feels slow** (decided
  2026-10-15). The importer rewrites `.folio/imports.md` after every file
  (`src/vault/logseqImport.ts`), which is O(n²) on a large graph. Flushing every N files
  would trade that for a crash window of N re-appends. Revisit only on a measured slow
  import.

## Known costs

Measured and left as they are, with the symptom that would reopen them.

- **Long-page typing cost** — **measured, accepted** (decided 2026-09-11, while the page
  surface was still Milkdown). Re-profiled on the production build at 1500 blocks
  (157 KB): the 53-char burst is 84% native renderer time (1063 ms of 1261 ms sampled), so
  the per-keystroke term is browser-side and no cheap lever exists
  (`content-visibility`/`contain` made it worse). The line-number gutter was then the one
  app-side cost the earlier archive under-measured: it ran 3-6 times per burst (the
  debounced change plus every `ResizeObserver` reflow a layout-changing keystroke
  triggers), each pass O(blocks) measure plus 1500 span writes, for a 120-150 ms hitch
  after typing stops. That gutter went with the CodeMirror surface (ADR-0029), so the
  browser-side number is the one to carry forward and the rest needs re-measuring before
  it is trusted. Left as-is: long pages are hypothetical. Revisit if a real page above
  ~3000 blocks stalls.
- **Find-in-page over the page listing** — the Pages listing holds only the rows near the
  viewport, so the browser's own find cannot reach a row scrolled far away (the app's
  search still covers every note). This is the trade the windowed listing makes; it keeps
  list semantics and a total size so it is not read as short. Revisit if it bites in use.
