## Context

See `proposal.md` for why. Facts that shape the approach:

- `src/editor/referenceBadges.ts` already does exactly this kind of decoration: `scanReferences(doc, range?)` walks the range's text nodes, skips `code_block` subtrees and `inlineCode` marks, and returns `{ marks, refs }` — ProseMirror inline decorations carrying a `class`. The plugin's `apply` maps the existing set through the transaction, drops what the edit touched (`decorations.find(range.from, range.to)` then `remove`), and rescans only the affected top-level blocks.
- That means a second inline decoration scheme costs **no extra pass** if it joins the same walk and the same decoration array: the removal step is range-based, so a changed block's strike spans are dropped and re-added along with its badges.
- `scan` is injectable (`ReferencePluginOptions.scan`) and the tests already use that seam.
- The current scan's walk is over `node.text` with `findReferenceRanges` from `src/vault/parse.ts` (the same canonical regex the index uses).
- The module is imported in three places: `src/editor/milkdown.ts`, `src/components/shortcuts.test.ts`, and its own test.
- `EditorPane.module.css` styles the badge with `.editor :global(.ref)`; the strike decoration needs the same shape of rule.

## Goals / Non-Goals

**Goals:**

- `~~text~~` reads crossed in Folio while the file, the clipboard, and the index keep exactly what the user typed.
- No new dependency, no schema/parser/serializer change, and no added per-keystroke cost.
- One rule, stated precisely, so the behaviour is predictable rather than approximate.

**Non-Goals:**

- No strike *mark*: no toggle chord, no input rule, no schema node or mark, nothing to round-trip through the serializer. A mark would need the Markdown parser and serializer wired for `~~`, and Milkdown exposes the GFM remark plugin only whole (see the proposal's alternatives).
- No hiding of the tildes. They are text; hiding them would leave the caret able to enter invisible characters and would diverge from how badge markers behave (the `#` stays visible).
- No GFM preset: tables, task lists, autolinks, and footnotes stay out.
- No change to paste, copy, search, or the index.

## Decisions

### D1 The struck runs join the existing scan, in the same walk

`scanReferences` becomes `scanInline` and pushes a `Decoration.inline(from, to, { class: 'strike' })` for each matched run in the text node it is already visiting. The plugin, the invalidation logic, and the injected-scan seam are unchanged: a keystroke inside one paragraph still costs one paragraph, and the strike decorations are carried or removed by the same range-based step.

Rejected: a second plugin for strike. It would be a second walk over the same changed blocks per keystroke and a second decoration set to keep consistent, for no isolation worth having — the two decorations are the same kind of thing over the same text.

Rejected: a decoration computed from a regex over the *serialized Markdown* on every change. It would re-parse the document per keystroke, against the editor's budget rule, and the positions would not map back to the document.

### D2 The run rule, stated exactly

A run matches `~~` + content + `~~`, where the content is at least one character, contains no tilde, and starts and ends with a non-space character: `/~~([^~\s](?:[^~]*?[^~\s])?)~~/g`.

- `~~a~~`, `~~a b~~`, `~~multi word run~~` match.
- `~~~~` (empty), `~~ spaced ~~` and `~~ ~~` (padded), `~single~` (one tilde), `~~a b ~c~~` (a tilde inside) do not.
- `~~~~`, `~~~~~` and longer tilde runs do not, so a `~~~` code fence — a block node the walk skips anyway — cannot be half-matched. The content's ends must be non-tilde as well as non-space, which is what stops `~~~~~` from matching a lone `~` as its content.
- `~~a~~b~~` strikes `a` and leaves the tail: the first pair that closes wins. Specified rather than left to chance, because the alternative reading (one run spanning both) is what a later reader would otherwise assume.

This is GFM's common shape, not its whole rule set (GFM also allows a tilde inside a run and applies flanking rules for emphasis-like edge cases). The simplification is deliberate: the app does not parse the GFM grammar, and a rule a reader can hold in their head beats an approximation of one it cannot.

### D3 Presentation only, no mark

Nothing about the document changes, so a struck run is invisible to everything that reads the file: the index, search, backlinks, copy-as-Markdown, and another Markdown tool all see the tildes. The cost is that there is no chord to toggle a run and no way to cross text without typing the tildes — accepted, and named in the proposal as the alternative that was rejected.

### D4 The module is renamed

`referenceBadges.ts` → `inlineDecorations.ts`, with the test file alongside it. The module now owns two decorations over literal text, and a file named for one of them would misdirect the next reader. The reference-specific exports keep their names (`REFERENCE_OPEN_SHORTCUT`, `ReferenceRef`, `referenceAt`, `referenceKey`), and the plugin factory becomes `createInlineDecorationPlugin` with the `$prose` wrapper `inlineDecorations`, since it is no longer only about badges.

## Risks / Trade-offs

- [Prose that happens to contain `~~` gets crossed] → The same reading GFM and every other Markdown tool gives that text; the rule excludes the padded and empty forms that prose is most likely to hit by accident.
- [A strike span and a reference badge overlap on the same text] → ProseMirror nests overlapping inline decorations, so `~~#Inbox~~` renders both; verified in the browser as part of the tasks.
- [A future real strikethrough mark would collide with this decoration] → It would arrive as a separate change, and the decoration would be deleted then; the spec names the decoration as the current behaviour, not as a mechanism.
- [The decoration adds nothing to the keystroke path but does add work to the initial scan] → One regex per text node in the same pass that already reads each node, bounded by the open document, paid on load and on the changed blocks of an edit.

## Migration Plan

None. No persisted state, no file-shape change: a vault written before this change renders the same way after it.
