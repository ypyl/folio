## Why

The previous change made each region's bar a hover-revealed thumb. In use that is the wrong trigger: the bar is invisible for as long as the pointer is elsewhere, which is most of the time a long page is being read, and the reveal is unreliable at the region's edges. A scrollbar's job is to say "there is more below" without being asked; hiding it until hover removes the one piece of information it exists to carry. The bar should be on screen whenever the region can actually scroll, which is the platform's own rule and the one a classic scrollbar follows.

## What Changes

- **The thumb is painted `--stone` unconditionally**, so Chromium draws it for exactly as long as the region can scroll and never when it cannot. The `:hover` rule and the transparent resting fill are removed.
- **Everything else about the bar stays**: the reserved lane and its platform width, the thin rounded inset shape, the app's ink, the two opt-outs, and the rule that the app draws no element over the content.
- **`DESIGN.md`'s Scroll regions rule changes one clause**: the thumb is shown whenever the region overflows, not revealed while the pointer is over it. The "do not add a scroll listener" note becomes "do not gate the thumb on hover or on scrolling".

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the scroll-region requirement's thumb clause changes from hover-revealed to always shown while the region overflows. The gutter, the lane's width, the opt-outs, and the platform-fallback clause are unchanged.

## Non-goals

- **Not a return to the platform's native bar.** The thumb is still the app's own; only its visibility rule changes.
- **No fade, delay, or transition.** The thumb is simply present while there is overflow.
- **No change to the recipe's shape, the lane's width, or the two opt-outs.**
- **No JS, no listener, and nothing on the typing or scrolling path.**
- **No new dependency and no ADR.**

## Impact

- CSS only, in the same five stylesheets: remove each region's `:hover::-webkit-scrollbar-thumb` rule and change the thumb's `background-color` from `transparent` to `var(--stone)`.
- `src/scrollRegions.test.ts`: the thumb must be inked unconditionally, and no region may carry a `:hover` thumb rule.
- `DESIGN.md`: the Scroll regions section.
- `package.json` 0.15.0 → 0.15.1. A correction to the just-shipped bar, not a new capability.
