# Proposal

## Why

A page or journal written by the app currently ends wherever the user's last
keystroke left it: a page ending in `Done` is saved as `Done` with no trailing
newline unless the user pressed Enter. The file therefore has no empty line at
its end, so there is no clean place to continue writing when the page is
reopened, and the vault's files are inconsistent about their final line. Every
page and journal should end with one empty line, always.

## What Changes

- An open page or journal always ends with exactly one empty line: the editor
  presents one when the page opens, and every page or journal file the app
  writes ends with one.
- The terminal empty line is normalized: a file with no trailing newline, one
  newline, or several trailing blank lines all become exactly one empty line. A
  page with no content is a single empty line.
- Opening a file does not write to it. A file that already lacks the trailing
  empty line shows one in the editor and gains it on its next save; a file the
  app never edits is never rewritten.
- The content above the terminal empty line keeps every character the user
  typed. The terminal line is the only thing the app normalizes.
- Boards are not affected (a board is an `.excalidraw` file, not Markdown), and
  the Logseq import is not affected (it has its own append rule).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editing`: a new requirement that a page or journal ends with an empty line,
  covering both the editor's document and the file the app writes; and the
  "open page is edited in place" requirement gains the terminal-empty-line
  exception to its rule that line breaks are preserved as typed.

## Impact

- **New**: `src/vault/trailing.ts` (the pure normalization) and its unit test.
- **Changed**: `src/vault/index.ts` (`upsertPage` normalizes before it writes and
  before it stores the page's content in the index, so the file and the index
  agree), `src/App.tsx` (the editor's seed content is normalized, so the empty
  line shows when a page opens), and the editing spec via the change's delta.
- **Tests**: `src/vault/trailing.test.ts`, an `upsertPage` case that asserts the
  written bytes and the indexed content, and an App integration case that opens
  a file without the trailing line, confirms the editor shows it and the file is
  not rewritten, then edits and confirms the saved file ends with one empty
  line.
- **Relations to prior decisions**: ADR-0009 (Markdown is canonical) is
  reinforced, not changed: the normalization is a small, explicit rule about the
  file's shape. The editor stays vault-free (ADR-0010) because `App` normalizes
  the seed string it passes in; the editor component never imports the helper.
  No new ADR: this is a file-shape rule, not an architectural boundary.
- **Version**: a minor bump (new user-facing behavior).
- **Not affected**: no backend, database, block model, storage abstraction, or
  parser change; the typing path gains one string normalization per save, not
  per keystroke.

## Non-goals

- Not touching boards (`.excalidraw`) or any non-Markdown file.
- Not changing the Logseq import's own output rules; imported pages are out of
  scope for this change.
- Not rewriting existing files on open; a file the user never edits keeps its
  bytes.
- Not stripping trailing spaces, blank lines in the middle of a page, or any
  other whitespace: only the terminal empty line is normalized.
- Not adding a user preference or a setting for the behavior.
- No backend, no database, no block-based document model.
