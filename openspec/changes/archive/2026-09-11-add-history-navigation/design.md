## Context

See `proposal.md` for why. The facts that shape the approach:

- The trail today is a de-duplicated move-to-front stack (`src/history.ts` `pushHistory`), recorded by one effect in `App` keyed on the open page, and rendered by a `History` accordion in `Sidebar` as rows resolved against the index. A stack cannot support stepping (see D1).
- `Sidebar` is one scroll region (`overflow-y: auto`), and the Pages list is a `div` of one `<button>` per page. Row geometry is fixed: 6px padding + 14px text = 33px, plus the list's 2px gap, so a row occupies a 35px stride (the same numbers `Sidebar.module.css` uses to size its skeletons).
- The sections above the list change height without a React render: `<details>` toggles are DOM-only, and the calendar changes month. Anything measuring the list's offset has to notice that on its own.
- Measured by `add-page-history`: 10,000 rows cost about 5.4 s to mount, a debounced re-render costs 10-17 ms, and nothing about the sidebar is on the keystroke path (the editor's listener debounces). Windowing is the lever for the first number; the memo already covers the second.

## Goals / Non-Goals

**Goals:**

- Back and Forward in reach at any vault size, with a trail model that actually supports stepping.
- The Pages listing's cost bounded by the viewport instead of by the vault, with the listing unchanged in order, marking, scroll extent, and what assistive technology can read.
- Numbers for both, in this file, on the same harness as `add-page-history`.

**Non-Goals:**

- No keyboard chords, no browser-history integration, no router (proposal Non-goals).
- No list UI for the trail: the section is removed, nothing replaces it.
- No virtualization library and no second scroll region: one pure range function and the sidebar's existing scroll container.
- No change to the trail's lifetime rules (session only, cleared per folder) or to its entry content (paths only).
- No ADR: nothing here is a boundary, a persistence rule, or a cross-ADR coupling.

## Decisions

### D1 The trail becomes a visit log with a cursor

```
  state:  { entries: string[], cursor: number }     cursor marks the open page

  append(A)        entries [A]                 cursor 0
  append(B)        entries [A, B]              cursor 1
  Back             entries [A, B]              cursor 0     (unchanged entries)
  append(C)        entries [A, C]              cursor 1     (B truncated)
  append(B)        entries [A, C, B]           cursor 2     (a repeat is a new entry)
  append(B) again  entries [A, C, B]           cursor 2     (the open page adds nothing)
```

- A new navigation truncates everything ahead of the cursor and appends, which is the only rule that makes Forward mean something coherent.
- The cap drops from the head and shifts the cursor by the number dropped, so the open page stays marked at 20 entries.
- Rejected: keeping the de-duplicated stack and stepping through it. Returning to an earlier page moved that entry to the top and dropped its old position, so the sequence you walked is gone the moment you revisit anything, which is exactly when Back matters. This reverses `add-page-history`'s D1 on purpose.
- Rejected: two structures (the old trail for display plus a back/forward pair of stacks). Two sources of truth that can disagree, for a screen that no longer displays the trail.

### D2 Stepping must not append, so the recording effect takes a suppression flag

Recording lives in one effect keyed on the open page (`add-page-history` D3), which is what makes every route in — including the journal the app opens by itself — get recorded without touching each handler. A step also changes the open page, so without a guard it would look like a navigation and append.

The guard is a ref the control handlers set and the effect consumes:

```
  Back/Forward handler:  stepRef.current = true;  navigate(path); setLog(step(...))
  recording effect:      if (stepRef.current) { stepRef.current = false; return }  append(path)
```

Rejected: inferring a step by comparing the new path against the entries next to the cursor (ambiguous when the same path is adjacent, and wrong when a real navigation lands on a path that happens to be adjacent). Rejected: moving recording into every navigation handler (six call sites, and it would miss the app's own journal open).

### D3 The section is removed, not relocated or re-homed

Relocating it above Pages pushes the primary list down and makes the sidebar's top a contest between a 20-row list and the vault's pages. A dropdown on the Back control is more UI than the ask, and a second scrollable surface inside the sidebar breaks the single-scroll-region rule the meta panel and sidebar both follow. The trail stays as state; the controls are its only presentation, which is what the spec now says.

### D4 The control row is a sticky, non-section header of the sidebar

- First child of the sidebar's `<aside>`, before the first `Accordion`.
- `position: sticky; top: 0` with the sidebar's own surface token, so rows scroll under it cleanly — the same technique the meta panel uses for its bottom-anchored section (no shadow: Kami allows none on a surface that does not float).
- Two icon buttons with accessible names "Back" and "Forward", `disabled` when there is nothing in that direction, and the app's standard visible focus ring.
- Deliberately no keyboard chords, and specifically nothing on `Alt+Left`/`Alt+Right`: those belong to the browser, and Folio has no router to make them meaningful.

### D5 Windowing is one pure function plus one measured container

```
  windowPieces({ total, stride, viewportHeight, scrollTop, listTop, overscan, keep })
    -> [ { kind: 'rows', indexes: [412..437] }, { kind: 'gap', rows: 412 },
         { kind: 'gap', rows: 9562 } ]

  +--------------------------------------+  sidebar scroll container
  | [ Back ] [ Forward ]                 |  sticky, in flow
  | Journal / calendar                   |  varies in height, no React render
  | Pages                                |
  |   <li spacer height = rows*stride>   |
  |   page 412 .. page 437               |  bounded by the viewport
  |   <li spacer height = rows*stride>   |
  +--------------------------------------+
```

The shape is a sequence of runs and gaps rather than one range with two spacers,
because the row to keep (the open page) can sit far outside the window: one
range plus two spacers cannot place a single row a thousand entries away without
rendering everything in between, while a gap costs one number. `rows` is a
count, never a list, so a vault-sized gap is O(1).

- The pure part is the range and the two spacer heights; it is unit-tested without a browser.
- The measured part: a layout effect and a scroll listener recompute from `scrollTop`, `clientHeight`, and the list's offset inside the container (one `getBoundingClientRect` read), coalesced with `requestAnimationFrame` so at most one recompute happens per frame and a state update happens only when the range actually changes. A `ResizeObserver` on the container and on the content above the list covers the accordion toggle and the calendar's month change, which move the list without re-rendering.
- The initial range is the first rows of the listing, never the whole list, so no render is ever vault-sized; a small vault fits inside it entirely, which is also why the existing tests (small fixtures, and jsdom reports no layout) keep rendering every row without layout stubs. In a browser the layout effect measures before paint, so the first painted range is already the viewport's.
- Assistive technology gets the full listing through list semantics: the listing is a real `<ul>` with a `<li>` per row (so `list` and `listitem` are native roles), spacers are `role="presentation"`, and each row carries `aria-setsize` and `aria-posinset` (valid on `listitem`, unlike on a button). The open page's row is always included in the range even when it is off-screen, so `aria-current` is never missing from the DOM.
- Rejected: a virtualization dependency (one list, one function); `content-visibility: auto` (measured as a regression in the gutter work, and it does not remove element or layout cost); a fixed-height inner scroller (a second scroll region).

### D6 The memo stays; its job gets smaller

With a bounded range the sidebar's render is O(viewport) — about 25 rows — so the memo's per-pause saving drops from ~10 ms to a fraction of that. It still prevents re-rendering the rows in view on every typing pause, it is already shipped and tested, and it costs one comment. Any new prop added to `Sidebar` must go into the prop-stability inventory; the window state is internal, so this change should add none.

## Measurements

Harness: production build served by `vite preview`, Chromium through `playwright-cli`, a vault of **10,000 pages** in the Origin Private File System, 1600x900, CDP CPU profiles at 50 µs sampling, the app's background index refresh frozen (the app gates it on `document.visibilityState`, which the harness reports as `hidden`). Same harness as `add-page-history`. One build carried both listings behind a URL flag, so the windowed and unwindowed costs are measured back to back in the same session on the same vault.

**1. What is in the document.** Windowed: **34 rows** for 10,000 pages (an 803px viewport holds 24 rows at the 35px stride, plus the 10-row overscan), with a sidebar `scrollHeight` of 350,377px — 10,000 x 35px plus the 377px of sections above the listing, so the scroll extent is the whole listing. Unwindowed: 10,000 rows.

**2. App start** (grant permission, build the index, first render; the index build is identical in both runs, so the difference is the sidebar's):

| listing | rows in the document | busy JS in the window | DOM-op self time | grant to first rows |
|---|---|---|---|---|
| unwindowed | 10,000 | 2,683 ms | 47.4 ms | 21.6 s |
| windowed | 34 | 2,196 ms | 0.7 ms | 19.7 s |

The sidebar's first render costs about **490 ms of JS and 1.9 s of wall time** at 10k pages; the wall difference is mostly browser-side layout and paint of 9,966 rows that are no longer built.

**3. Per navigation** (a click on a page row, profiled):

| listing | busy JS | react-dom frames in it |
|---|---|---|
| windowed | 46 ms / 16 ms (two runs) | ~4 ms / ~1.5 ms |
| unwindowed | 106 ms / 74 ms | ~20-30 ms |

Windowing removes **30-70 ms of JS per navigation** at 10k pages. Transition costs, measured once: windowed to unwindowed (34 rows to 10,000) is 675 ms of JS; unwindowed back to windowed (10,000 to 34) is 82 ms, mostly `removeChild`.

**4. Reaching every page.** Jumping to the end of the listing renders positions 4 to 10,000 with the last row (`page-0.md`, oldest by mtime) present and clickable: clicking it opens `page-0.md`. Collapsing the Journal section moves the listing up (extent 350,377 -> 350,128) and the end is still reachable, so a layout change above the listing is picked up rather than assumed. Mid-listing, the rendered positions bracket the scroll offset (first rendered position 130 at `scrollTop` 5,000 with a 249px offset above) **plus** the kept active row at position 10,000, which is the design's point: the open page's marking is in the document even when its row is far outside the window (45 rows rendered in that state). The sidebar reports **0 inner scrolling elements**, so it is still the single scroll region. The 10-row overscan also absorbs the layout shifts the accordion and calendar can cause (the calendar is ~250px, which is 7 rows), which is why a stale measurement of a few rows is invisible.

**5. Stepping** (windowed listing, a trail of several entries):

| action | busy JS | DOM-op self time |
|---|---|---|
| Back | 14.1 ms | 0.6 ms |
| Forward | 12.6 ms | 0 ms |
| Back again | 22.4 ms | 0.7 ms |
| a plain row click, for comparison | 17.3 ms | 0.8 ms |

A step costs what opening a page costs, because that is what it does: the trail's own work is O(cap) over at most 20 entries, the suppression is one ref read and consumes no frame of its own, and the frames in the profile are the editor's teardown and mount (`updatePluginViews`, `destroy`, `removeEventListener`). The controls tracked the cursor correctly through the sequence: Back enabled and Forward enabled after a step back, Forward disabled at the tip of the trail, and Forward disabled again after a fresh open from a stepped-back position — which is the truncation rule working, since a repeat of the open page adds nothing.

Wall-clock numbers on a shared machine move together by up to about 1.5x between runs (the earlier changes documented the same); every comparison above is back to back in one session, and the ratios are what they are for.

## Risks / Trade-offs

- [A step appends instead of moving the cursor] → one suppression ref (D2), plus a test that asserts the trail's entries are byte-identical after Back then Forward.
- [The range goes stale when layout above the list changes without a render] → recompute on scroll and through a `ResizeObserver`; verify by hand in the measurement run: expand Journal, change the calendar month, scroll to the end, click the last row.
- [Windowing weakens the listing for screen readers and for find-in-page] → list semantics with total size and position, the open page's row always rendered, and the trade-off stated in the spec rather than hidden. Find-in-page still cannot find unrendered rows; that is a real cost of the approach and it is why the listing must never be read as a short list.
- [The stride assumption drifts from the CSS] → one constant tied to the CSS comment that documents the 33px row and 2px gap; rows already truncate to one line, so nothing wraps.
- [Scroll position jumps when the range changes] → the spacers keep the scroll extent equal to the full list, and the windowing code never writes `scrollTop`; it only reads.
- [The cap and the cursor disagree at 20 entries] → the cap drops from the head and shifts the cursor; a test navigates past the cap and asserts the open page is still marked and Back still works.
- [Removing the section loses "what have I been reading"] → accepted in the proposal's Non-goals; if a list is wanted later it is a separate change, and the trail that would feed it still exists.
- [The controls are mouse-only until chords exist] → accepted; the shortcuts reference stays honest because nothing new is bound.

## Migration Plan

No data migration: the trail lives in memory for a session and nothing is written to a vault. On disk, only specs change (`page-history` requirements removed and re-declared, `ui-shell` re-declared, `static-navigation` modified). Reverting the change restores the previous behaviour completely. Measurement is re-run on the same harness as `add-page-history` (production build, 10,000-page OPFS vault, Chromium through `playwright-cli`, CDP profile) and its results are recorded in this file when the change is applied.

## Open Questions

- The overscan size (a fixed row count versus a multiple of the viewport) is a one-line constant. Deferrable: the measurement decides, and either way the rendered count stays bounded.
- Whether the two controls should also carry hover titles beyond their accessible names is polish, not behaviour. Deferrable to implementation.
