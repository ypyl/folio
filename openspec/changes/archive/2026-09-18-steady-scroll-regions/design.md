## Context

See `proposal.md` for why. What the design has to work with:

- Seven scroll regions the app owns, each opened with a bare `overflow-y: auto`: the editor pane, the sidebar pane and its two band bodies (Pages, Assets), the meta panel and its three band bodies (Backlinks, Forwardlinks, References), and the search results list. A sixth, the search dropdown, already opts into `scrollbar-gutter: stable` — the fix, applied once out of seven times.
- `DESIGN.md` has no rule covering scroll regions at all. Its "Side panes are columns of bands" section says *where* a listing scrolls and *when* the pane itself falls back to scrolling, and says nothing about the bar itself. That gap is why each region chose its own default.
- `FolderRail.module.css` fixes the rail at `width: 56px; box-sizing: border-box; padding: 0 8px 0 4px` — 44px of content box for 40px controls — with `overflow-x: hidden`.
- Milkdown's language popup is styled by `.language-list` in `EditorPane.module.css`: `max-height: 280px; overflow-y: auto`.
- The sidebar and meta panel bands are measured: each band is observed with a `ResizeObserver`, and the listing inside it is windowed against `scrollTop`, `clientHeight`, and `listTop` (`pageWindow.ts`).

## Goals / Non-Goals

**Goals:**

- A region's content keeps its width as it crosses the overflow threshold, in both directions.
- Content never narrows anywhere the platform was not already going to narrow it.
- The rule is stated once, so the next scroll region does not have to rediscover it.

**Non-Goals (design-level):**

- Any scrollbar styling. Not one colour, width, or transparency value.
- Any overlay scrollbar or custom thumb, and therefore any wrapper element, scroll listener, or component.
- Any change to a scroll region's box, its measurement, or its scrolling behaviour.

## Decisions

### D1. Reserve the gutter, do not force the scrollbar

Two CSS mechanisms would hold a region's content width steady:

```
  overflow-y: scroll          overflow-y: auto + scrollbar-gutter: stable
  --------------------------  --------------------------------------------
  the bar is always drawn     the bar is drawn only when needed
  the track is always         the lane is always reserved, painted as
  painted, arrows and all     an extension of the padding
  content width: constant     content width: constant
```

`scroll` solves the jump by making the scrollbar permanently visible, which trades a reflow for a rail on every pane — louder than the problem. `stable` reserves the lane and leaves the bar's visibility to the platform, so an empty region looks empty and the space is simply not reused. One region in the app already does this; this change is the rule the other six were missing.

### D2. The reservation is exactly what the platform charges

`scrollbar-gutter: stable` reserves the platform's own scrollbar width and nothing else, and — per the property's definition — reserves **nothing at all where the platform uses overlay scrollbars**, because those do not live in a gutter.

```
  platform                      classic scrollbars        overlay scrollbars
  ----------------------------  ------------------------  -------------------
  Windows / Linux (Chromium)    lane ~11-17px, reserved   n/a
  macOS                         n/a                       NO gutter reserved
  touch                         n/a                       NO gutter reserved

  so: the fix applies where the content was going to move,
      and is a no-op where the bar already floats.
```

This is why the change is safe to apply unconditionally: it does not invent a dead strip on a platform that never had one, so there is no platform for which the app needs a different rule. It also means the app must **not** style its scrollbars to compensate — setting `scrollbar-width` or `scrollbar-color` opts a Chromium region out of the platform's native bar, which is the opposite of what this change wants.

### D3. Seven regions in, two regions out

```
  IN    EditorPane   .pane         the document; the jump a user actually notices
        Sidebar      .sidebar      the pane's fallback scroll
        Sidebar      .scrollBody   Pages and Assets bodies (one rule, two regions)
        MetaPanel    .panel        the pane's fallback scroll
        MetaPanel    .fillBody     Backlinks/Forwardlinks/References (one rule, three)
        SearchResultsView .pane    the full match list
        SearchBox    .drop         already reserves; unchanged

  OUT   FolderRail   .rail         a fixed 56px column holding 40px controls
        EditorPane   .language-list  an overlay popup whose width is content-sized
```

Both exclusions are the same argument: the reservation is only free where the content has slack to give. The rail's content box is 44px and its controls are 40px, so a lane would take it to about 29px and `overflow-x: hidden` would clip the avatars rather than scroll them:

```
  rail today, not scrolling     rail today, scrolling      rail with a gutter
  +------------------+          +--------------+           +--------------+
  |  44px content    |          | 44-15 = 29px |           | 44-15 = 29px |
  |   +--------+     |          |  +-----+ clip|           |  +-----+ clip|
  |   | 40px   |     |          |  | 40  | ... |           |  | 40  | ... |
  |   +--------+     |          |  +-----+     |           |  +-----+     |
  +------------------+          +--------------+           +--------------+
```

The middle panel is a pre-existing defect — the rail already clips once it scrolls — and `stable` would make it permanent. Fixing it means changing the rail's width or its control size, which is a layout decision about the rail, not about scroll regions, so it stays out of this change and is recorded as a follow-up. The language popup is the same shape of argument with a milder cost: its width comes from its content, so widening it to make room for a lane would move the popup's own edge.

### D4. No measurement is touched, and nothing reaches the scroll path

A reserved gutter changes a scroll container's **content width**; it does not change the container's box. Every measurement the banded panes depend on is either the box (`getBoundingClientRect`, `clientHeight`) or the scrolled offset (`scrollTop`), so `windowPieces` and the sidebar's windowing see exactly the geometry they saw before. The number of rows a body renders for a given vault is unchanged, which is what the existing sidebar windowing tests assert.

No JavaScript, no listener, and no element is added anywhere, so this change cannot appear on the keystroke path or the scroll path. It is a paint-time layout property.

### D5. The rule lives in DESIGN.md

`DESIGN.md` gains one short section under the layout rules, stating the rule, naming the regions, and naming the two opt-outs. It is a styling contract, not an architecture decision: nothing about how the app is built changes, no boundary moves, and no alternative was weighed at the level an ADR records. The rejected alternative worth remembering — replacing the native scrollbar with our own — is recorded here instead, along with why it is out of scope (it needs a component, a wrapper per region, a JS scroll sync, and it cannot reach CodeMirror's own scroller, so the app would ship two scrollbar looks side by side).

## Risks / Trade-offs

- [Content is permanently narrower by the scrollbar width in the included regions] → Accepted, and it is the point: the width is now constant rather than flickering. The sidebar has 16px of right padding and the document 32px, so the reservation lands in slack that was already there.
- [The rail keeps a latent clipping defect] → Accepted and recorded as a follow-up (D3). It only fires once the rail itself scrolls, which needs more open folders than a normal window shows.
- [A future scroll region could be added without the rule] → Mitigated by writing the rule in `DESIGN.md` and naming the regions, which is the same mechanism the banded-pane rule already relies on.
- [No unit test can cover this] → Accepted, and stated: jsdom has no layout, and the repo has no CSS test anywhere because CSS modules are mocked to class names under vitest. The verification is a browser check of the overflow threshold in each region, which the change's tasks call out explicitly rather than leaving implied.
