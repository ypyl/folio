# Design

## Context

See proposal.md - Why. The completion source (`src/editor/codemirror.ts`,
`completionSource`) already computes the right rows; the loss happens inside
CodeMirror's own dialog pipeline. Two CodeMirror behaviors are in play:

- `CompletionDialog.build` calls `sortOptions`, which, unless a result sets
  `filter: false`, builds a `FuzzyMatcher` from `state.sliceDoc(result.from,
  result.to)` and drops every option whose `label` does not fuzzy-match. The
  replace range starts at the `#`, so the pattern is `#re` and no page name
  matches. With zero options, `build` returns null and no popup is created.
- The autocomplete source runs on every document change; nothing below the
  source inspects syntax, so code context is the source's responsibility.

The removed ProseMirror plugin kept two rules the replacement dropped: code
contexts never complete, and the popup shows the app's already-ranked rows
(`referenceSuggest.ts`, deleted in `5fee6fd`; `referenceSuggest.test.ts`, 610
lines, deleted with it).

## Goals / Non-Goals

**Goals:**

- The popup appears for `#`, `#[[`, `#!`, and `#![[` prefixes and shows the
  rows the app's pools produced, in the app's order.
- No popup inside fenced code or inline code.
- A test that would have caught the empty popup: mount the real adapter, type,
  and assert rows.

**Non-Goals:**

- Reworking triggers, pools, ranking, or token forms (ADR-0012, unchanged).
- Styling the tooltip against DESIGN.md tokens.
- Touching the `EditorAdapter` seam or `VaultStorage` (ADR-0010, ADR-0003).

## Decisions

**D1 - Disable CodeMirror's re-filter with `filter: false` on the result.**
The app's ranker is the single source of truth for which rows show and in what
order; the spec fixes that order (favorites first, then most recently modified).
Re-filtering with a `#`-prefixed pattern is wrong and lossy, and leaving the
default off (the current bug) yields no dialog. Setting `filter: false` makes
CodeMirror use the rows as given, scoring them `1e9 - index`, so source order is
preserved.

Alternatives considered:

- *Point `from` after the `#` so the pattern matches labels.* Rejected: the
  replace range must cover the whole typed token so accepting writes the
  canonical form; splitting the sigil from the replace range would corrupt the
  text (`##Reading`) or duplicate the sigil logic in every `apply`.
- *Set `validFor` and keep filtering.* Rejected: `validFor` only works while
  filtering is on, which is the broken path, and the docs forbid combining it
  with `filter: false`.
- *Give options labels prefixed with `#`.* Rejected: the spec requires each row
  to show the page's name as it exists, not the token.

Apply `filter: false` to all three results (boards, pages, files). Pages and
boards are the reported breakage; the file picker shares the same silent-drop
failure mode (a typed destination that does not fuzzy-match the label), and
disabling the second pass keeps its rows in the pool's order.

**D2 - Guard code context in the source, using the syntax tree at the caret.**
Resolve `syntaxTree(state).resolveInner(pos)` and return null when an ancestor is
`FencedCode` or `InlineCode`. This mirrors the old plugin's `code_block` /
`inlineCode` guard and the badge rule already in the spec. Reading the tree at
one position is cheap and does not scale with the document; the live-preview
plugin already reads the tree over visible ranges, so this adds no new class of
work to the typing path. The check runs only after a trigger matched and before
the pools are queried, so the common non-trigger keystroke pays nothing.

Alternative considered: scan the line for fence markers. Rejected: it cannot see
inline code and reimplements the parser.

**D3 - Test the popup through a mounted adapter, asserting the last mile.**
The existing `completionSource` tests stop at `.apply` / `.from` / `.to` and
cannot see filtering or the dialog. The new test mounts `CodeMirrorAdapter`,
dispatches the typed text (or uses `insertMarkdown`), and asserts open state and
rows through CodeMirror's own exports, `completionStatus(view.state)` and
`currentCompletions(view.state)`, which need no layout; a second case places
`#re` inside a fence and inline code and asserts no popup. Asserting the tooltip
DOM (`.cm-tooltip-autocomplete`) is an optional extra, since jsdom has no
layout. This is the coverage the swap removed.

## Risks / Trade-offs

- [With `filter: false`, CodeMirror no longer narrows rows as the user keeps
  typing until the source re-runs.] → The source already re-runs on every typed
  change and narrows via the app's ranker, so the visible set still shrinks; this
  is the intended single-filter design.
- [`filter: false` prevents reusing a prior result via `validFor`, so each
  keystroke re-runs the source.] → The source is one pass over a memoized pool,
  which AGENTS.md's typing budget explicitly allows, and it only runs when a
  trigger matches.
- [A caret-position syntax lookup could disagree with the parser while a tree is
  stale mid-typing.] → CodeMirror advances the tree with each transaction; the
  badge pass trusts the same tree for the same code rule.
- [Resolving `FencedCode`/`InlineCode` by node name couples to the grammar's node
  names.] → Those are the names the live-preview already relies on
  (`INLINE_MARKS.InlineCode`), so the coupling already exists in the module.
