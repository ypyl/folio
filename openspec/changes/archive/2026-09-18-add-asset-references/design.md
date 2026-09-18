## Context

See `proposal.md` for why. What the design has to work with:

- `referenceTrigger` / `referenceToken` / `parseLinks` / `parseAssetPaths` already live in `src/vault/parse.ts` as pure functions of content, and `isVaultRelative` (`src/vault/assetOpen.ts`) is the single definition of "a vault path", shared by the image resolver and the index.
- The completion popup (`src/editor/referenceSuggest.ts`) is a ProseMirror plugin whose state is derived from the document and the caret, rendered by a `PluginView` positioned with `popupPlacement`, with `popupVisible` deciding whether it is on screen. Its `apply` returns `prev` when nothing relevant changed, which is what keeps it off the keystroke path.
- `suggestPages(query, pool)` ranks a pool of `{name, path, lower, starts}` rows. Nothing in the ranker is page-specific.
- `App` already builds the page pool once per graph (`useMemo(() => candidateNames(graph, pins), [graph, pins])`) and hands the editor a query function.
- `linkForAsset(path)` (`src/components/dropAssets.ts`) is the app's one rule for the text that names an asset; drop and paste both call it, then `adapter.insertMarkdown`.
- Milkdown's commonmark preset has **no link input rule** (`inputRules` and `markInputRules` cover blockquote, lists, code block, `---`, headings, emphasis, strong, inline code — not links), so typing `[Q3](assets/q3.pdf)` by hand leaves literal text with no link mark until a reload re-parses it.

## Goals / Non-Goals

**Goals:**

- A page gains a reference to a file already in the vault, from the editor, without a drop, a paste, or hand-typing a path.
- The reference that lands on disk is the same ordinary Markdown link every other path produces — same form, same label rule, same bytes.
- No new reference syntax, no new surface, no new persisted or derived data, nothing added to the keystroke path.

**Non-Goals (design-level):**

- Re-editing an existing destination in place (see D2's closing limitation).
- A picker for page-path destinations (`.md` paths are pages, and pages are named, not pathed).
- A picker anywhere other than an open link destination (no chord, no sidebar, no toolbar).

## Decisions

### D1. The trigger is the link destination: `](`

```
  textblock text, caret at "|"
  ----------------------------------------------------------------
  [Q3 report](|          empty query        -> no popup
  [Q3 report](q|         query "q"          -> popup iff a file matches
  [x](http|              "http"             -> no match, no popup
  [x](http:|             scheme             -> not vault-relative: no trigger
  [x](#sec|              fragment           -> no trigger
  [x](/abs|              absolute           -> no trigger
  [Q3](a|b.pdf)          ")" after caret    -> no trigger
  ![shot](|              image destination  -> same trigger, image form
  `[x](q|`  / fenced     inside code        -> no trigger
```

Detection mirrors `referenceTrigger` exactly (same shape, same code site): the last `](` before the caret in the same textblock, a matching `[` earlier in it, nothing but the typed destination between `](` and the caret, no `)` immediately after the caret, and the query accepted by `isVaultRelative` and not starting with `#`. It is a pure function in `src/vault/parse.ts`, beside `referenceTrigger`, because it is a lexical rule about a reference's destination and the editor may not own the knowledge of what a vault path is (ADR-0010).

Why not a sigil: `@name`, `![[file]]`, and `[[file]]` all invent a third on-disk reference form, which ADR-0012 refuses; `[[` additionally contradicts the `page-references` scenario asserting that `[[Rea` shows no picker. Why not a chord: a chord-opened popup has no query to filter by, so it either lists the whole vault unfiltered or steals keystrokes into a filter input — a new modal mode with its own keymap, IME handling and dismissal, versus a trigger that gets filtering for free from the document. Why not the Assets sidebar row: that is a different gesture (mouse, and it writes the page from outside the editor), and it can be added later without touching this design.

### D2. The popup is silent until the typed text matches a file

No popup on the empty destination (the moment right after typing `(`), and the existing `popupVisible` rule — non-empty suggestions — hides it whenever nothing matches. This is what makes a trigger on every Markdown link cheap: `[x](h` pops only if a vault file starts with `h`, so external URLs, fragments and absolute paths never flash anything, and typing a link to a page (`[x](#page)`) is untouched because a `#`-leading destination is not a trigger (the reference picker owns it).

Two consequences, both accepted:

- The picker is discovered by typing a file's name, not by opening a link. That is the same discovery path the `#` picker has.
- A destination that is already complete cannot be re-picked: the `)` guard rejects `[Q3](assets/q3.pdf|)`. Completing into a closed destination would have to leave the rest of the typed text behind, exactly the case `referenceTrigger` already declines. To re-pick, delete the destination.

### D3. One plugin, two triggers, one popup

`referenceSuggest.ts` becomes the app's one completion plugin. `SuggestionState` gains a `kind: 'page' | 'file' | null`; `derive` asks the destination trigger first and the reference trigger second; `accept` branches; the popup, its keys (`ArrowUp`/`ArrowDown`, `Enter`/`Tab`, `Escape`), its placement, its blur/scroll handling and its reference-equality short-circuit are unchanged and shared.

The alternative — a second plugin with its own key and its own popup — duplicates the whole view hook, key handler and dismissal rules for two states that are lexically exclusive, and reintroduces the possibility of two popups being on screen at once. One state machine, two row kinds.

The popup's accessible name comes from the kind (`Pages` / `Files`).

### D4. The candidate pool is the vault's files minus its pages, built once per graph

Rows are `{ name, path, lower, starts, image }`, where `name` is `assetName(path)` — the path inside `assets/`, the label the sidebar and the References section already use, so one file reads the same everywhere — and `image` is whether the extension is one `linkForAsset` writes as an image. The pool is `[...graph.files]` filtered by `!isPagePath(path)`, sorted by path, and memoized in `App` on `[graph]`, exactly like `suggestPool`.

That set is not arbitrary: it is precisely the paths a page's asset references can name (the `vault-index` requirement filters asset references by "vault-relative, not a page, and held by the vault"), so the picker can only offer a reference the index would report. Files outside `assets/` are offered for the same reason the pane already resolves and opens them (ADR-0022): `assets/` is a convention, not a schema.

The ranker (`suggestPages` → `suggestCandidates`) needs no change beyond one narrowing check: while the typed syntax is `![`, rows whose `image` is false are skipped. The image-only rule is what keeps `![` from inserting an image node over a PDF, and it is the same extension set `linkForAsset` already uses to choose `![..]` over `[..]`, so drop and picker agree on what an image is. The check is a boolean read per visited row: no allocation, no second pass.

Cost accounting (AGENTS.md): the pool is rebuilt only when the graph identity changes; a keystroke walks the already-built pool, comparing a precomputed lowercased string, exactly as the page picker does today. Nothing new is read from disk, no per-candidate allocation, and the index gains nothing to derive — `pageAssets` already resolves a picked link on the next scan, so the References section fills in with no new code.

### D5. Accept replaces the whole typed construct with the parsed form

Because there is no link input rule, inserting the destination as text alone would leave literal bracket characters in the document while the serializer expects the syntax to have been *consumed* by the mark. So accept is one transaction that replaces the whole construct, brackets included:

```
  label empty      [](q3|            -> text node "q3-report" with link mark
  label typed      [Report](q3|      -> text node "Report" with link mark
  image syntax     ![](sh|           -> image node { src, alt: "shot" }
  image, labelled  ![icon](sh|       -> image node { src, alt: "icon" }
                                        (src = the encoded destination)
```

The typed syntax decides the form and the label is the typed one, or the file's stem when empty — the same label `linkForAsset` uses. One transaction means undo is one step, and the caret maps to the end of the inserted node.

### D6. One escaping rule for every destination the app writes

`markdownDestination(path)` (in `dropAssets.ts`) percent-encodes `%`, space, `(`, `)`, `<`, `>`, `"`, `'`, and backtick, leaving `/` and the rest of the path alone; `linkForAsset` uses it, and so does the picker's accept. This closes an existing defect rather than adding a feature: `[Q3 report](assets/Q3 report.pdf)` is not a link — micromark ends the destination at the space — so today a dropped file with a space in its name is listed in the References section (the index's own scanner is more permissive than any Markdown parser) while the editor has no anchor to Ctrl+Click. `encodeURIComponent` is the wrong tool: it escapes `/` and leaves parentheses, which is why the rule is explicit. `parseAssetPaths` already decodes with a raw-path fallback, so the index, the References panel, the image resolver and the open gesture all keep working with no change.

## Risks / Trade-offs

- [Popup flashing on unrelated typing] → bounded by the zero-match silence rule (D2). A prefix that matches no file never renders; a URL reaches its scheme in at most four characters.
- [A picked link does not appear in References until the next scan] → accepted: references are derived data (ADR-0001), rebuilt on the same refresh as every other edit's, exactly as a drop's link is today.
- [The pool is a stale snapshot of the folder] → accepted and consistent with the sidebar: a file added outside the app appears after the next refresh (`vault-index` external-change requirements).
- [Two triggers, one state machine] → the risk is an accepted-then-reopened popup. Mitigated by the existing `suppressed` rule, which closes the popup for the exact token text it just wrote; the destination trigger re-arms only when the typed text changes.
- [Destination escaping is a behaviour change to drop and paste] → deliberately taken (proposal: What Changes). It is a `page-editing` delta, and the existing tests that assert the raw form are updated with it.
