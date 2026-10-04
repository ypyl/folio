# Proposal

## Why

A result row now shows one snippet per place the query occurs (show-every-match-per-result), and the requirement says occurrences far apart are shown as **separate** snippets. They are separate elements with a 6px gap, but nothing visible divides them, so in a row with two snippets the last line of the first and the first line of the second read as one continuous passage. The reader cannot tell where one place ends and the next begins.

## What Changes

- A snippet after the first in a row is separated from the one above it by the same `--border-soft` hairline that separates result rows, rather than by a gap alone.
- The separator is presentational only: it adds no text, no control, and nothing to the page or the file.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `search`: "Results are grouped by kind with labels and match snippets" — a row's separate snippets are visually separated from one another, so "separate" is visible and not just structural.
- `search`: "Search results view shows the full match set" — its rows carry the same separator, since both surfaces share the row body.

## Non-goals

- Not changing how many snippets a row shows, or which ones.
- Not changing the separator between result rows or between groups.
- Not changing the snippet text, the context, or the cap note.
- Not touching the editor, the vault, or any file on disk.

## Impact

- `src/components/MatchBody.module.css` — the `.window + .window` rule.
- `DESIGN.md` — the Search result rows rule names the separator.
- Tests: the `MatchBody` stylesheet test.
- No new dependency, no ADR change. Relates to ADR-0006 (keep it small).
