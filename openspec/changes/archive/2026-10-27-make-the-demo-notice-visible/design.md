# Design

## Context

See proposal.md - Why. The demo's session-only rule already exists in the
Welcome page's first paragraph. `EditorPane` is the one surface every demo page
shares, and it is already the scroll container for the document. A real vault
passes the same component, so the notice cannot be baked into the page content
or the brand screen.

## Goals / Non-Goals

**Goals:**
- Make the session-only rule impossible to miss on any demo page.
- Keep the notice visible when the document scrolls.
- Cost nothing on the typing path and add no state.

**Non-Goals:**
- No dismiss control or onboarding flow.
- No notice on the brand screen, board, results, or a real vault.
- No change to the demo's lifetime or content.

## Decisions

**The notice is a sticky strip at the top of the editor pane.** `EditorPane`
already owns the scroll container, so `position: sticky; top: 0` keeps the
notice in view while the document scrolls beneath it. A strip outside the pane
would require restructuring the workspace grid; a notice inside the page content
would scroll away, which is the problem being solved.

**A `demo` boolean prop controls it.** App derives the flag from the active
folder's `demo` field, so the notice follows the same source of truth as the
rail entry and the demo's landing page. No new state, no effect, and no read of
the vault per render. The prop is false for every real folder, for the brand
screen, and for the board and results modes, which do not render `EditorPane`.

**The notice is text, not a control.** It has no dismiss button, so it cannot be
hidden and then missed; closing the demo is the way to leave the notice behind.
It carries a `Demo` label in brand ink and the sentence in secondary ink on the
brand tint, the lightest sanctioned surface. It renders once per page mount, so
it adds nothing to a keystroke.

## Risks / Trade-offs

- [A sticky strip takes about 37px from every demo page] -> the demo is a
  teaching surface, and the notice is the point; real vaults pay nothing.
- [A page's `min-height: 100%` plus the notice adds a small scroll to a short
  page] -> at most one strip's height, on the demo only, and the document's
  bottom space is already intentional.
- [The notice disappears on the board and results views] -> those views have no
  editor pane; the status bar still names the demo, and the user has seen the
  notice on every page. A workspace-wide banner would cost a layout change for
  a message the page surface already carries.
