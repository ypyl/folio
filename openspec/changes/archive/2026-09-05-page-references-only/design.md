## Context

The only reference-parsing code in the repo is the throwaway micro-renderer `MarkdownPreview.tsx` (plan task 7 will replace it with Milkdown). Its regex currently matches three forms: `[[Page]]`, `#[[Page]]`, and `#word`. The index step (plan task 6) is not built yet, so this change affects wording in plan/docs and the renderer behavior itself. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One grammar, two forms (`#word`, `#[[Page]]`), enforced at the renderer and documented in specs/ADRs so the future parser and editor consume the same contract.
- No "tags" vocabulary anywhere in product code, docs, or specs.

**Non-Goals:**
- No index implementation, no Milkdown work, no escape syntax. Behavior of search/backlinks is untouched (nothing implemented yet to change).

## Decisions

**1. Regex: drop the plain-wikilink alternative.**
Current: `\[\[([^\]]+)\]\]|#\[\[([^\]]+)\]\]|#([\w-]+)`.
New: `#\[\[([^\]]+)\]\]|#([\w-]+)`.
Rationale: removing the first alternative means `[[Page]]` falls through as literal text, which is exactly the required behavior. No other parser exists to update.
Alternative considered: keeping a `[[Page]]`-as-text lookahead — unnecessary; the fall-through is free.

**2. Token rename `--tag-bg` → `--chip-bg`.**
The `.chip` class already uses neutral naming; only the CSS variable and DESIGN.md rows carry the "tag" label. Rename keeps chip styling vocabulary consistent (`chip-bg`, matching the `.chip` class), and DESIGN.md's "Tags / badges" section becomes "References / chips".
Alternative considered: `--ref-bg` — fine too, but `chip` matches the existing component class and component-file name (`MarkdownPreview.module.css` uses `.chip`).

**3. Mock data rewritten to the two forms.**
All `[[Name]]` links become `#Name` (every mock page name is a single word: `#Welcome`, `#Inbox`, `#Folio`, `#Ideas`, `#Reading`). One `#[[...]]` example is added (e.g. a `#[[reading list]]`) so the second form is exercised. Prose mention of "a #tag" and "Tagged" is reworded to reference language (e.g. "A #word is just a link to a page", "Noted under #architecture").

**4. ADR-0012 updated in place, ADR-0004 alongside.**
ADR-0012's core decision (one page namespace, no tags concept) is unchanged; only the lexical set narrows from three forms to two. Editing the record in place matches the repo's MADR convention ("Status changes are reflected by editing the record"). ADR-0004's index shape keeps `via` but narrows it to the two remaining forms (`'word' | 'bracketed'`), since both spellings are now hash-forms. Older ADRs and `research/` stay as historical records.
Alternative considered: a new ADR-0014 superseding 0012 — heavier than warranted; same-topic refinement is an edit, not a new record.

## Risks / Trade-offs

- `[[Page]]` in existing notes now renders as literal text instead of a chip. This is intended (the reference grammar changed), but users' existing content will show brackets literally. → Mitigation: this is a deliberate product decision (ADR-0006: no migration compatibility); the mock vault is disposable.
- `#word` matching `[\w-]+` means prose like "the #1 issue" reads as a reference to page `1`. → Mitigation: pre-existing behavior, unchanged by this change; documented in the spec's form definition.
- Renaming the token touches DESIGN.md and both CSS files; any future code referencing `--tag-bg` breaks. → Mitigation: `rg` sweep for "tag" after the rename catches stragglers; only one consumer exists today.

## Migration Plan

Not applicable — mock-data app, local-first, no deployed users. Rollback is a git revert of the change commit.