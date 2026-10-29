# Design

## Context

See proposal.md — Why. The pieces that shape the approach:

- `src/search/core.ts` is the whole search: `FUSE_OPTIONS` for the index,
  `exactRanges`/`wordRanges` for highlighting and literal ranking, and
  `searchDocs` for the AND-term model and its tiers. All of it folds case with
  `.toLowerCase()` before comparing, so case sensitivity is one flag threaded
  through three functions, not a second search path.
- `SearchSpotlight` owns the query, the corpus (`docs` from App), and the Fuse
  instance, which is memoized on the corpus identity. Both surfaces are fed from
  one run: `run` calls `searchDocs` and reports the full set through
  `onQueryResult`, which App hands to `SearchResultsView`. So a case-sensitive
  run reaches both surfaces without the view learning a new input.
- The results view re-runs nothing. It groups the `SearchResult[]` it is given
  by the operator in the query text, so the toggle stays inside the spotlight.
- `src/components/SearchSpotlight.module.css` already has an absolutely
  positioned clear `×` inside `.box`; the toggle needs a positioned wrapper so
  the `×` stays over the field's right edge rather than over the new control.
- Ranking is tier first (exact title, exact body, fuzzy title, fuzzy body), and
  "exact" already means "every term occurs literally". A case-sensitive run only
  narrows what counts as literal; the tier order is untouched.

## Goals / Non-Goals

**Goals:**

- One press turns the query into a case-sensitive search, and one more turns it
  back, with the query text untouched.
- Every rule that can match or mark text — literal, whole-word, fuzzy, snippet
  highlight — follows the same flag, so a result never shows a mark the search
  did not match.
- With the toggle off, nothing changes: same results, same order, same ranges.
- The toggle adds nothing to the typing path.

**Non-Goals:**

- No per-term case rule, no smart case, no persistence, no chord.
- No change to the operator model or to the Fuse index's other options.
- No second Fuse instance held warm for the other mode.

## Decisions

### D1: A toggle, not a query operator

The operator catalogue's contract is "at most one operator, and it reorders
results" (search operators). `case:` would have to opt out of both: it must
combine with `board:` or `title:`, and it changes which results exist rather
than where they sit. A control also flips a typed query in one press, where a
token has to be typed, remembered, and removed.

Alternative rejected: a `case:` token. Cheap to parse, but the first-operator
rule would silently drop `case:` next to `title:`, and a user typing `case:
Docker` would get an empty result set with no explanation beyond "no matches".

### D2: Case is a run parameter, defaulting to today's behavior

`searchDocs(fuse, query, caseSensitive = false)`, with the same trailing default
on `exactRanges` and `wordRanges`. Every existing caller and test keeps working
unchanged, the default is visible in the signature, and the unit tests can pin
both modes against the same corpus.

The fold is a local choice per call rather than a pre-folded corpus:

```ts
const needle = caseSensitive ? term : term.toLowerCase()
const hay = caseSensitive ? text : text.toLowerCase()
```

Case-sensitive mode therefore skips allocating folded copies, and the flag never
becomes state that two lists could disagree about.

### D3: A fuzzy hit must begin in the typed case

Fuse's case-sensitive matcher still treats a differing case as one edit, so
`docker` fuzzy-aligns `Docker` (score 0.73) and the pressed mode would keep the
very casing it was meant to exclude. `searchDocs` therefore drops a
case-sensitive fuzzy hit whose aligned region does not begin with the term's
first character in the exact case:

```ts
if (caseSensitive && !short && !alignedInCase(item, term, hit)) continue
```

`alignedInCase` walks the hit's match regions and compares one character each,
so it allocates nothing and runs once per candidate. A real typo typed in the
same case (`dockr` against `docker`) still starts on `d` and survives; a case
variant does not. A case difference mid-word still counts as a typo, because
Fuse reports a region, not a per-character alignment, and inventing one would
be a second matcher to maintain.

Alternative rejected: require the term's characters in order anywhere in the
field. It accepts `kubernetes` against `Docker Kubernetes`, because the `k` of
`Docker` supplies the lowercase first letter.

Alternative rejected: drop the fuzzy fallback entirely when the toggle is on.
It is the smallest rule, but it makes the toggle also mean "no typos", which is
a second behavior the user did not ask for.

### D4: The Fuse index is kept per mode, built lazily

Fuse folds case at index time (`isCaseSensitive` is read when the index is
built), so the mode is part of the index's identity. A ref holds a small cache
keyed by the corpus identity and the mode:

```ts
type Indexes = { docs: SearchDoc[]; byMode: Map<boolean, Fuse<SearchDoc>> }
```

`fuseFor(cased)` resets the cache when `docs` changes identity, builds a mode's
index the first time it is asked for, and returns it after that. The collapsed
mode's index is the one typing uses, so no keystroke builds one, and the first
press that switches modes builds the other once and keeps it. Building both
eagerly with two `useMemo`s would put the second build on the vault-open path
instead of on the press that needs it; rebuilding on every press would make each
flip cost an index build (D8).

`fuseOptions(caseSensitive)` returns `{ ...FUSE_OPTIONS, isCaseSensitive }`, which
keeps the one definition of the fuzzy config in `core.ts`.

Alternative rejected: keep one case-insensitive index and post-filter its hits.
It avoids the second index but re-implements Fuse's matching to decide which hit
was really case-exact — a second source of truth for a piece of the matcher, and
the pressed mode's result count would then depend on what the folded index chose
to return.

### D5: The press runs the query immediately, not through the debounce

`handleChange` debounces because each keystroke is a partial query; a press is a
complete instruction about a query that is already typed, so the press cancels
any pending timer and re-runs at once with the index for the new mode, inside
the click handler. An effect keyed on the mode would have to set state from an
effect to publish that run, which is a cascading render the lint gate rejects
and a second path for the same work. The previous list stays on screen until the
new run lands, so a press never blanks the dropdown.

The toggle keeps focus in the input, so the next keystroke continues the search
rather than landing on the control.

### D6: The toggle belongs to the query, so close keeps it and clear resets it

Closing the spotlight already keeps the query so reopening restores the
matches; the mode is part of that same state and survives with it. Clearing means
starting over, so clear — the `×` and Escape — resets the mode to off along with
the text. Anything else would make a clear-then-retype search silently
case-sensitive.

It is component state, not App state: the results view needs the results, not
the mode, and no other surface reads it. Nothing is persisted, so a reload starts
from off, exactly as it starts with an empty query.

### D7: The toggle is a labelled pressing control in the field's row

A 26px square `Aa` button after the field, `aria-pressed`, `aria-label="Match
case"`, with `--stone` ink at rest and `--brand` ink when pressed; hover takes
the `--warm-sand` surface the clear `×` uses. `Aa` is the convention a search
field already taught its users (VS Code, editors, browsers) and needs no legend;
the accessible name carries the words.

The dialog's `.box` gains a positioned `.field` wrapper around the input and the
`×`, so the `×` keeps its offset from the input's right edge and the toggle sits
outside it. The toggle is in the tab order after the input, so the keyboard
reaches it without a chord.

### D8: The cost on the typing path, measured

A keystroke still does one debounced `searchDocs` over the in-memory index; the
change adds one boolean read per term. Highlighting in case-sensitive mode does
less work than today's, because it no longer lowercases the haystack. The only
new cost is the first press that asks for a mode's index, which is off the
keystroke path.

A scratch benchmark (Node, `fuse.js` 7.5, synthetic pages of 40 paragraphs, the
app's own `FUSE_OPTIONS`) measured the index build, the one thing a press pays
for:

| corpus | text | folded build | case-sensitive build |
|---|---|---|---|
| 500 pages | 3.5 MB | 10.4 ms | 9.7 ms |
| 2,000 pages | 14.1 MB | 37.7 ms | 39.2 ms |
| 5,000 pages | 35.2 MB | 90.7 ms | 91.6 ms |

The two modes cost the same, ~18 µs per page. One press per corpus pays it (the
first time that mode is asked for); every later press is free, and nothing
about typing changes, so no typing measurement is needed.

## Risks / Trade-offs

- [A case-sensitive query looks broken when the user's spelling differs by
  case] → The toggle shows its pressed state, the empty state names the query,
  and one press brings the matches back; the query text never changes.
- [Both modes' indexes stay resident once used, roughly doubling the search
  index's memory for that corpus] → The docs themselves are shared by reference
  and only the token index is duplicated; the exchange buys a press that costs
  nothing after the first (D4, D8). If memory ever matters more, dropping the
  unused mode's entry on a corpus change is one line.
- [A case difference mid-word is still treated as a typo] → The gate compares
  the aligned region's first character only, because Fuse reports a region, not
  a per-character alignment (D3); the common confusion is at a word's start, and
  that is what it rejects.
- [A press while the debounce is pending could run a stale query] → The press
  reads `query` from state, which already holds the latest keystroke, and
  cancels the pending timer; the single run it issues uses the new mode.
- [The toggle's pressed styling could drift from the app's palette] → It uses
  registered tokens only, and DESIGN.md records the rule beside the field's.
