## Why

`steady-scroll-regions` reserved each region's lane so content stops reflowing, but left the platform's own bar standing in it. On Windows that bar is a permanent, full-height track with steppers at both ends, and it is the one control the user stares past while reading a long page. Every other surface in the app is Kami: warm neutrals, no chrome. The scrollbar is the only visible piece of the operating system the app does not dress. It is also always on screen when the user is not scrolling, which is most of the time.

## What Changes

- **Every scroll region's bar becomes the app's own thumb**: thin, rounded, inset in the lane the region already reserves, painted in the app's `--stone`, invisible at rest and revealed while the pointer is over the region. This is the behaviour Mantine names `type="hover"`, done in CSS.
- **The reveal is CSS only**: `::-webkit-scrollbar` and its track and thumb pseudo-elements on the region, with a transparent thumb that takes the ink under the region's `:hover`. No component, no listener, no measurement, no dependency.
- **The reserved lane stays, at its current width.** Only the bar's paint changes, not the space it occupies, so content width is exactly what `steady-scroll-regions` shipped and the reveal cannot reflow anything either.
- **The two opt-outs keep opting out**, for the same reasons: the folder rail (a 44px content box holding 40px controls) and an overlay popup such as the code block's language list (content-sized width). Neither gains a styled bar.
- **`DESIGN.md`'s "Scroll regions" rule is rewritten.** The gutter stays as it is; the clause that the bar is never restyled becomes "restyled once, to a hover-revealed thumb in the reserved lane", and the recipe is written down once instead of each region choosing.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the scroll-region requirement changes on one point. The gutter requirement, the opt-out clause, and the no-dead-strip clause all stay. What changes is that the bar is no longer the platform's own: it becomes the app's hover-revealed thumb, in the lane, with the platform bar outside Chromium left alone.

## Non-goals

- **No Mantine, and no `ScrollArea` component.** No dependency, no thumb element in the DOM, no scroll or resize listener, no measured position, no element drawn over any content.
- **No overlay scrollbar.** The thumb lives in the reserved lane, so it never covers a character and never changes content width. The Mantine component's `offsetScrollbars` floating look is explicitly not what this is.
- **No hide delay and no fade.** A scrollbar pseudo-element takes no `transition`, so the thumb appears and disappears with hover immediately. Mantine's `scrollHideDelay` has no CSS equivalent.
- **No reveal while scrolling without hover.** Hover is the only trigger. Scrolling with the keyboard while the pointer is elsewhere leaves the bar hidden.
- **No change to the folder rail or the language popup**, and no widening of any lane to make room for a larger thumb. A region that opted out stays exactly as it is, platform bar included.
- **No change to any region's scrolling behaviour**: no auto-scroll, no scroll-into-view, no sticky behaviour, no new measurement, no windowing.
- **No new dependency, no JS, and nothing on the keyboard or scroll path.**
- **No ADR.** Nothing architectural is decided. The styling contract lives in `DESIGN.md`, which is where this rule already lives.

## Impact

- CSS only, in `src/components/EditorPane.module.css`, `src/components/Sidebar.module.css`, `src/components/MetaPanel.module.css`, and `src/components/SearchResultsView.module.css`. Four regions carry the recipe, or one shared global rule does, if that reads smaller.
- `src/scrollRegions.test.ts` extends: the region must reserve its gutter *and* reveal the designed thumb, and the two opt-outs must do neither. The file already reads the stylesheets from disk, so the check stays a source check.
- `DESIGN.md`'s "Scroll regions" section is rewritten; nothing else in the file changes.
- `package.json` 0.14.1 → 0.15.0. The app gains a designed bar in every region, a user-visible capability, so a minor bump.
- `PLAN.md` gains one numbered task describing what shipped.
- Verified on Chromium only, which is the app's only supported browser. Where a platform draws overlay scrollbars (macOS, touch), a styled `::-webkit-scrollbar` is ignored and the platform's own floating bar remains, exactly as `steady-scroll-regions` documented.
- Cost: the bar's lane stops being the platform's default paint and becomes a small webkit rule. No layout change, no cost on typing or scrolling.
