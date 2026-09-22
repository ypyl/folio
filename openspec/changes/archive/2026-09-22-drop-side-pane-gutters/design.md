## Context

See proposal.md — Why. Both panes are `overflow-y: auto` with `scrollbar-gutter: stable` and the app's thumb recipe, which `src/scrollRegions.test.ts` enforces by reading the stylesheets: any selector with `overflow-y: auto` must reserve its gutter and carry the thumb, unless it is on the opt-out list (`.rail`, `.language-list`). The accordion bodies inside the panes are separate scroll regions with their own gutter and thumb.

## Goals / Non-Goals

**Goals:** stop reserving 16px on each pane for a bar that normally never appears; keep every section readable and reachable; keep the change off the typing path.

**Non-Goals:** touching the bodies, the editor pane, the floors, or the panes' collapse behavior.

## Decisions

**Drop the gutter and the thumb; keep `overflow-y: auto`.** The pane's bar is a last resort (a window too short for the sections' minimum heights), so a lane that is empty on every ordinary window is a poor trade. Keeping `overflow-y: auto` means that last-resort case still scrolls instead of clipping — the pane loses only its reservation, not its reachability.

- Rejected: **`overflow: hidden` and letting the bodies absorb everything.** It matches "scrolling inside the accordion items" literally, but the flexible sections carry `min-height: 120px` (a ui-shell requirement), so on a window shorter than the fixed bands plus those floors the content would clip and be unreachable. Removing the floors to fix that is a separate, larger behavior change.
- Rejected: **keeping the gutter.** That is the 16px the change exists to reclaim.

**The panes join the no-reservation group rather than getting a third category.** The existing rule already has a group of regions that reserve nothing and therefore carry no app thumb; the panes become members of it, with their own reason written down. That keeps one rule, one test, and one `DESIGN.md` paragraph instead of a special case bolted on the side.

**`src/scrollRegions.test.ts` grows the two selectors on its opt-out list.** The test is the guard that the rule is followed; adding the panes there is what makes the rule change real rather than a stylesheet the test would flag.

## Risks / Trade-offs

- **Fallback reflow** → on a window too short for the sections' floors, the pane's platform bar now appears without a reserved lane and the bands shift once. Accepted: the case is rare (the default layout needs roughly a 560px-tall window before the sidebar overflows), and the alternative costs the lane on every window.
- **A future scroll region could be added to the opt-out list to dodge the rule** → the list is a documented exception with a reason per entry, and `DESIGN.md` states the rule; a reviewer sees a new entry.
- **Keystroke budget** → nothing on the typing path. This removes a laid-out gutter; no JS, listener, measurement, or DOM changes, and the body geometry the sidebar's windowing reads is untouched.
