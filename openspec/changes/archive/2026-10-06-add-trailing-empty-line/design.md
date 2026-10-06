# Design

## Context

The editor hands App the document's Markdown verbatim (`codemirror.ts`'s
`changeListener`), and App's saver writes it through `upsertPage`, which calls
`storage.write(path, content)` and stores the same `content` on the page in the
index (`src/vault/index.ts`). The editor is seeded from
`initialContent = openDraft?.content ?? page?.content ?? ''` in `App.tsx`, and
the pane applies it once on mount. Nothing trims or normalizes a page's
trailing whitespace today. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- One terminal empty line on every page/journal the app opens and writes.
- One small, pure normalization, applied at the two boundaries that matter.

**Non-Goals:**

- Boards, the Logseq import, `.folio/` state files, and any non-page write.
- A preference, a setting, or a per-vault toggle.

## Decisions

**D1 — Exactly one terminal empty line.** The normalization is: strip the text's
trailing newlines, then append `\n\n`; a text that is only trailing newlines (no
content) becomes a single `\n`. This makes `Done`, `Done\n`, and `Done\n\n\n` all
become `Done\n\n`, and an empty page `\n`. "Exactly one" (rather than "at least
one") is what makes the vault's files consistent, which is the point.

**D2 — The helper lives in the vault layer.** `src/vault/trailing.ts` exports
`withTrailingBlankLine(text)`. It is a rule about the on-disk shape of a page, so
it belongs beside `parse` and `index`, and App — the integration layer — imports
it. The editor component never imports it (ADR-0010): App normalizes the seed
string it passes down, so the pane still knows nothing about the vault.

**D3 — Normalize the seed and the write, nowhere else.** App normalizes
`initialContent` so the empty line shows when a page opens, and `upsertPage`
normalizes before `storage.write` and before it stores the page's content in the
index, so the file and the index agree. Two call sites, one function.

- Alternative rejected: normalize inside `VaultStorage.write`. That is the
  filesystem boundary, not the page boundary: it would also touch boards,
  `.folio/pins.md`, and every other write, and the storage layer should not know
  what a page is.
- Alternative rejected: normalize only in App's save callback. The index would
  then keep the unnormalized content while the file held the normalized text, so
  a search snippet or a reopened page could disagree with disk.

**D4 — Opening does not write.** The seed normalization is in-memory: the pane
displays the empty line, but no file is written until the user edits. This keeps
"a file the user never edits keeps its bytes" true and avoids rewriting a vault
on open. The draft's `saved` value stays the file's content, so an unedited page
is not dirty; the adapter's seed-echo swallows the initial dispatch, so no
spurious change fires.

**D5 — Boards and the import are out of scope.** A board is an `.excalidraw`
file, not Markdown, and the Logseq import has its own append-after-blank-line
rule and its own writer; neither goes through `upsertPage`'s page path. Leaving
them out keeps the change to the editing behavior the request names.

## Risks / Trade-offs

- [The normalization contradicts "line breaks are preserved as typed"] → The
  spec delta carves the terminal empty line out of the in-place rule explicitly,
  so the two requirements do not conflict.
- [Seeding a normalized document could mark an unedited page dirty] → The
  adapter's seed-echo skips the initial dispatch and the draft's `saved` stays
  the file's content, so an unedited page is clean and unrewritten; an App test
  pins this.
- [A whitespace-only page could be treated as empty] → Only trailing newlines
  are stripped; a page of spaces keeps its spaces and gains the terminal empty
  line. The empty case is the string with nothing but newlines.
- [Collapsing several trailing blank lines changes bytes the user may have
  wanted] → Accepted: "exactly one" is the stated behavior, and it is what makes
  files consistent; the alternative (append only when missing) leaves files
  inconsistent.
