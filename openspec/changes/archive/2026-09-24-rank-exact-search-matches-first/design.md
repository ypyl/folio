## Context

See proposal.md — Why. Today `searchDocs` in `src/search/core.ts` accumulates every doc that matched all query terms, then sorts the whole set once by `Fuse` score with `path` as the tiebreak. Both surfaces then split that one ordered list by `kind` (Pages, Journal, Boards, Assets) and keep the list's order inside each group, so a single sort decides the order everywhere. The range logic already computes, per term, whether an exact occurrence exists in `text` (`exactRanges`) and otherwise falls back to Fuse's fuzzy range.

## Goals / Non-Goals

**Goals:**
- Put literal matches ahead of fuzzy ones inside each kind group, in the order title-exact, body-exact, title-fuzzy, body-fuzzy.
- Keep the change inside the pure search layer, so both surfaces inherit it with no UI change.
- Keep the keystroke budget: the extra work is a bounded pass over the already-accumulated results, proportional to results and terms, not to vault or document size.

**Non-Goals:**
- Reordering across kinds, changing group order, or changing the per-group cap.
- Changing what matches, Fuse options, or the highlight/snippet/block logic.
- Persisting any ranking signal.

## Decisions

**Decision 1: Compute a four-level tier per result, sort on tier first.**
Each accumulated record gets a `tier: 0 | 1 | 2 | 3`:
- `0` exact title: every term has an exact (case-insensitive substring) occurrence in `title`.
- `1` exact body: not all terms exact in the title, but every term has an exact occurrence in `text`.
- `2` fuzzy title: not tier 0/1, and Fuse reported a match on the `title` key for at least one term.
- `3` fuzzy body: everything else (a Fuse `text` match only).

Sort becomes `tier` ascending, then `score` ascending, then `path`.

*Alternatives considered:* (a) "any term exact in title" for tier 0 — rejected: a page titled just `Docker` would outrank `Docker swarm notes` for `docker swarm`, which is the opposite of the user's intent. (b) A separate stable sort per tier — rejected: one composite comparator is simpler and keeps the existing tiebreak. (c) Reusing Fuse's `matches` to classify exactness — rejected: Fuse ranges are per-character and already treated as a fallback; `exactRanges` is the app's own definition of "exact", and using it keeps one source of truth.

**Decision 2: Track exactness where the term's ranges are already computed.**
The per-term loop already calls `exactRanges(item.text, term)`; extend the same loop to check `item.title` and record `titleExact`/`bodyExact` flags on the accumulator (all-terms-AND). No second scan of the text or title.

*Alternatives considered:* a post-sort pass over results recomputing matches — rejected: it re-scans text a second time and duplicates the term loop.

**Decision 3: The tier is internal; `SearchResult` keeps its current shape.**
The tier is only needed for the sort inside `searchDocs`, so it does not need to be exposed on `SearchResult`. If a surface later needs it, adding a field is a small follow-up. This keeps the public result contract and its tests stable.

## Risks / Trade-offs

- [A strong Fuse score is now capped by tier, so a very close fuzzy match can sit behind a weak exact one] → intended: literal text is the stronger signal than edit distance, and ties inside a tier still use Fuse relevance.
- [All-terms-exact is strict for multi-word queries, so a page with one exact term and one typo lands in a lower tier] → acceptable: a page where *every* term is literal is a categorically better answer; a mixed page still appears, just not first.
- [Extra per-term string scans of title and text] → bounded by terms × (title + text) for the docs that already matched, which the existing range logic already pays for text; adding the title scan is negligible and off the per-keystroke index-rebuild path (the Fuse index rebuilds only when corpus identity changes).
