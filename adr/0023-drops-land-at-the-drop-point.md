# ADR-0023: A drop lands at the drop point, and a drag carries a fact

- Status: Accepted
- Date: 2025-09-18

## Context

Two gestures put something into an open page from outside it: a file dropped from the operating system, and — after this change — a row dragged from the sidebar. Both needed answers the existing records did not give.

`insertMarkdown` wrote at `view.state.selection`, so a drop did not mean what a drop means. The user aims at a paragraph and releases; the link lands wherever the caret happened to be. The gesture is positional by nature and the implementation was not.

The second question is what travels on the drag. The sidebar knows a row's vault path or page name; the editor knows how the vault writes a file reference (`linkForAsset`) and how the reference grammar writes a page reference (`referenceToken`). Putting the finished Markdown in the drag payload would be fewer lines at the call site, and it would move the one rule that three writers and one reader already have to agree on into a fourth writer, in the UI layer, where nothing enforces the agreement. `text/plain` would be worse still: it hands the drop to the browser's text machinery, whose output is literal characters rather than parsed nodes — the reason the insertion path parses Markdown in the first place (ADR-0008 round-trip).

## Decision

**A drop means the point it was released at.** `insertMarkdown` takes an optional viewport point. The editor resolves it with `view.posAtCoords` and moves the selection there before inserting, so the existing insertion rules run at the drop point instead of being re-derived for it.

The point is resolved, not trusted:

- When it names no position in the document, the caret is used, as it was before drops carried a point.
- When the resolved position's parent cannot hold the payload — `canReplace` on the actual parsed fragment, not a list of node names — the caret is used. A drop on a code block does not corrupt it.

The selection move is a selection-only transaction: the document changes once, so a drop is one undo step.

**A drag between surfaces carries the fact it names, not the text it becomes.** The sidebar writes a vault path or a page name under a private MIME type. The receiving layer derives the text through the rules it already owns. A drag writes nothing to the vault: no file is copied, and no state but the open page's text changes.

**What a row offers is decided by the rule that already decides it.** A page row is a drag source only when its name can be written as a reference token that reads back to that name — the same predicate that keeps such a name out of the completion pool. The predicate is a lexical rule and lives with the other lexical rules in the vault layer, not in the component that happens to need it.

## Consequences

- A drop is one insertion path with one parse and one set of branches. The empty-paragraph and inline-unwrap rules, which took a change of their own to get right, are reused rather than duplicated at a second insertion site.
- An OS-file drop passes the same point, but its copy is asynchronous: the point is captured at the drop and resolved when the link is written, so a scroll during the copy lands the link where the pointer is when the link is written. This is the accepted ceiling; anchoring a position across the copy would need position mapping for a case measured in fractions of a second.
- A drag cannot write a reference that Markdown reads back as something else, because a row with no token form is not draggable. The cost is a row that does nothing when dragged, and a page that cannot be referenced by any gesture until its name changes.
- The sidebar learns no syntax. It gains two attributes per row and one handler, holds no new state, and takes no new prop, so the memoized sidebar still skips re-rendering while typing.
- Opening a file is unchanged: activating a row opens it (ADR-0021), and a drag is not an activation. Assets are still not pages (ADR-0022), and no third reference form exists (ADR-0012).
- The MIME types are private and the payload is not sensitive: an unknown `application/x-` type is ignored by any other application a user might drag a row onto.
- A later feature that wants to drag from the sidebar into something other than the page — a search box, a calendar, another pane — reuses the payload and supplies its own meaning for it, because the payload carries data rather than a rendering of it.
