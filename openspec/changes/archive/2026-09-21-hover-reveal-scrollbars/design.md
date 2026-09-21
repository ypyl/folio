## Context

See `proposal.md` — Why. The current state that shapes the approach:

- Seven scroll regions reserve their lane today, each with `scrollbar-gutter: stable` beside `overflow-y: auto`: the editor pane, the sidebar pane and its Pages and Assets bodies, the meta panel and its Backlinks and Forwardlinks and References bodies, the search results list, and the search dropdown (`SearchBox` `.drop`, which reserved before the others). Two regions opt out: the folder rail and the code block's language list.
- The rule lives in `DESIGN.md` ("Scroll regions") and is enforced by `src/scrollRegions.test.ts`, which reads the `.module.css` files from disk because vitest replaces a CSS-module import with a class-name proxy.
- The app is Chromium-only. `showDirectoryPicker` already gates the whole vault, and `DESIGN.md` records that a reserved gutter is a no-op where the platform floats its own bar over the content.

## Goals / Non-Goals

**Goals:**

- The bar of every gutter region reads as Kami: a thin, rounded, inset thumb in the app's muted ink, revealed while the pointer is over the region.
- Content width stays exactly what `steady-scroll-regions` shipped. The change is paint only.
- Nothing new on the typing or scrolling path: no component, no listener, no measurement.

**Non-Goals:**

- Matching Mantine's floating overlay thumb, hide delay, or reveal-while-scrolling. See `proposal.md` — Non-goals.
- Any change to where lanes are reserved, or which regions opt out.

## Decisions

**D1 — `::-webkit-scrollbar`, not the standard `scrollbar-color` / `scrollbar-width`.** The standard properties can hide and ink the thumb (`scrollbar-color: transparent transparent`, then `--stone` under `:hover`), and they are less code. They cannot inset it or round it: the thumb spans the lane's full width as a rectangle, which is the platform's shape, not Kami's. The webkit pseudo-elements give the inset pill (D3) and the app is Chromium-only, so the standard path buys nothing. Alternatives considered: `scrollbar-color` only (rejected: wrong shape); both, with the standard as a fallback (rejected: the fallback never fires in the app's supported browser, so it is dead CSS).

**D2 — The trigger is the region's own `:hover`, in CSS.** No class is toggled from JS and no scroll listener is added. The consequence is the Non-goal: the thumb does not appear when the region scrolls without the pointer over it (keyboard paging, a scroll-into-view). Making that work means a listener on every region, which is the Mantine component the proposal excludes.

**D3 — The thumb is inset with a transparent border and `background-clip: content-box`.** A 4px transparent border on both sides inside the lane leaves a 7px pill with an even 4px offset from the edge, which is the shape in the reference. Painting the lane's full width (a plain `background-color` thumb) is one line shorter but is the platform's rectangle. Alternatives considered: a `--pane`-coloured track with a full-width thumb (rejected: the track is visible chrome); a `min-height` floor on the thumb for very long documents (kept, `32px`, so a 100k-line page still leaves something to grab).

**D4 — The lane keeps the platform's width.** The recipe styles `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, and `::-webkit-scrollbar-thumb`, and deliberately sets no `width` on `::-webkit-scrollbar`, so Chrome keeps the size the platform would have used and the content width is bit-for-bit what the current build has. Setting an explicit width (say 12px) for a consistent lane on every machine was considered and rejected: it would change content width and break the spec's promise that the lane is the platform's own. The browser check confirms the lane did not resize; if Chrome turns out to collapse the lane without an explicit width, the fallback is an explicit width equal to the platform's default, plus a spec edit — flagged in *Risks*.

**D5 — The recipe is repeated in each region's module, not hoisted into a shared class.** A shared global rule would need a `scrollRegion` class added to seven elements across five components, which moves half the contract into TSX and leaves the source check reading both CSS and TSX. Repeating six lines alongside the `scrollbar-gutter` declaration each region already carries keeps the whole contract in the stylesheets, where `scrollRegions.test.ts` can see it, and matches how the gutter rule itself is written today. The test, not DRY, is what keeps the copies from drifting.

**D6 — The thumb's ink is `--stone` (`#6b6a64`).** The reference bar is a quiet mid-gray, and `--stone` is the design language's tertiary ink; it reads as a control that is present, not as content. `--dark-warm` was considered and rejected as too heavy for a control the pointer reveals.

The rule stated once, in `DESIGN.md`: a region that reserves a gutter carries the app's thumb; a region that opts out of the gutter opts out of the thumb too.

## Risks / Trade-offs

- **[Chrome collapses the lane when `::-webkit-scrollbar` sets no width]** → The browser check measures the pane's content width before and after the recipe; if it moved, add `width: <platform default>` (D4's fallback) and edit the spec's "the width the platform's own scrollbar would occupy" clause to name that fixed width. The spec is written to survive this: it promises the lane is not narrowed *by the thumb*, and the pointer-reveal scenarios assert content width, not the number.
- **[A platform that ignores `::-webkit-scrollbar` draws its own floating bar]** → Documented and expected: on macOS and touch the platform's bar is what scrolls the region, and the app adds nothing. The spec carries this as its own scenario.
- **[The thumb is invisible while the pointer is elsewhere, so keyboard scrolling shows no feedback]** → Accepted for the reasons D2 gives. Revisit only if it reads as broken in use; the fix is the Mantine component, a separate decision.
- **[Seven copies of the recipe drift]** → `scrollRegions.test.ts` gains the assertion: every gutter region reveals a thumb, and every opt-out region carries neither the gutter nor the thumb. A region that forgets fails the suite by name.
