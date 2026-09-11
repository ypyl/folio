## Context

See `proposal.md` for motivation and `specs/page-history/spec.md` for the behavior contract. The approach is shaped by four facts about the current code:

- `App.tsx` owns navigation in one `activePath` state. It is written by `handleSelect` (page rows, calendar days, links-pane rows, search results, reference badges) and by a separate effect that opens the folder's today journal as soon as a graph becomes ready (`static-navigation`: app loads to today's journal).
- `Sidebar` is not memoized and receives `onSelect` as a plain arrow redefined on every `App` render. Every keystroke therefore re-creates one row element per page in the vault. AGENTS.md's keystroke budget says a keystroke must not allocate in proportion to vault size, so this change carries the fix together with its measurement.
- `useIndex` returns `pins` as a fresh `[]` while the graph is null, which would defeat a memoized sidebar during indexing.
- The sidebar's rows are 33px (`Sidebar.module.css`) and the sidebar scrolls as a single region, so section height is real estate the Pages list competes for.

Relevant decisions: ADR-0004 (in-memory derived data is disposable), ADR-0001 (nothing new lands in the vault), ADR-0005/0006 (small shell, no feature creep). The `ui-shell` fence that fixed the sidebar at two sections is amended rather than ignored.

## Goals / Non-Goals

**Goals:**

- Make one-way navigation reversible with one click, without a router, a URL scheme, or a navigation event bus.
- Zero vault writes, zero new files, no `.folio/` entry: the trail is session memory.
- The trail costs nothing on the keystroke path, and the memoization that makes it free also removes the pre-existing per-keystroke work proportional to vault size.
- A recorded before/after number for the sidebar's render cost at vault scale.

**Non-Goals:**

- No trail cursor or forward stack. A move-to-front stack has no "forward" to return to, and the specs specify a list, not browser back/forward.
- No timestamps, visit counts, or durations. Nothing renders them, and they would add per-entry state to a render that must stay trivial.
- No change to how the open page is marked in Pages and Journal. The trail never claims `aria-current`.
- No refactor of `activePath` into a reducer, context, or history abstraction.

## Decisions

### D1 The trail is a de-duped stack, most recent first

Opening a page already in the trail moves it to the top instead of appending a second entry, so the trail holds each page at most once and its head is always the page being left behind.

Alternatives considered: a chronological log with duplicates (shows the route, but duplicates every target and grows with clicks, not with pages visited), and a browser-style cursor model with a back and a forward list (needs a forward stack, a truncation rule on branch, and a UI that exposes direction; the requirement is "click any of it to return", which a list already satisfies).

### D2 The section excludes the open page by path value, not by dropping the first entry

The trail's head is the open page once the recording effect has run, so dropping index 0 and filtering `path !== activePath` agree after every settled navigation. They disagree for exactly one frame:

```
  navigate A -> B
    setActivePath(B) commits; the recording effect has not run yet
      stack is still [A]
        drop index 0     -> []        one frame of wrong content
        filter by value   -> [A]      correct: B is open, A is where you were
    effect lands, stack [B, A]
      drop index 0     -> [A]
      filter by value   -> [A]
```

Filtering by value is therefore the rule, and the spec states the same thing in user terms ("excluding the page currently open"). A second consequence falls out: no trail row is ever the open page, so the section passes no `aria-current` and the Pages and Journal sections keep sole ownership of that marking.

### D3 Recording happens in one effect keyed on the open page

```
  activePath ──(change)──> effect: setTrail(pushHistory(trail, activePath)) ──> render
```

Rationale: every route into a page funnels through `activePath`, including the app's own journal open, which never passes through `handleSelect`. Recording in the handlers would need six call sites and would still miss that one. Recording inside a `setState` updater would be a side effect in a reducer. The effect runs once per navigation, never per keystroke, and the push is O(cap) over an in-memory array.

### D4 Trail state lives in `App`; the ordering rule is a pure tested module

New `src/history.ts` next to the project's other small root modules (`page.ts`, `lineAnchors.ts`): `HISTORY_CAP = 20` and `pushHistory(paths, path)` returning a new array, de-duped, capped, newest first. `App` holds it in one `useState` and calls the helper from the effect. The pure helper is where the only non-trivial logic lives, so it is where the test goes.

Alternatives considered: a `useHistory` hook (indirection over a single `useState`), and recording in a module-level mutable store (invisible to React, would need its own subscription).

### D5 No persistence; the trail resets when the active folder changes

Clearing in the existing folder-change effect (the same one that resets the open page, the last-known page, and the search surface) preserves an invariant worth having: **every path in the trail belongs to the open folder**, so a trail can never render a page from another vault, and the trail's top row means "where I was" unconditionally.

Alternatives considered:

- `sessionStorage`: survives a reload, but adds a per-folder key scheme, a read at boot, and cleanup when a folder is closed, and it changes what the spec must say about the trail's lifetime.
- `.folio/history.md`: permitted by ADR-0015, but it puts a file write on the navigation path, makes the 30s refresh re-read it, lets two open windows clobber each other, needs a prune policy specified in `vault-index`, and leaves a permanent record of reading habits in the user's notes folder. Pins are user intent; a trail is a side effect of reading.

### D6 The section is a third `Accordion`, open by default, with no loading variant

`Sidebar` gains `<Accordion title="History" defaultOpen>`, reusing the existing component, `styles.list`, and `styles.row`, and the meta panel's dimmed-row treatment for pages with no file. Collapsed-by-default was rejected because History is a live navigation control like Journal and Pages, not reference material like the keyboard-shortcuts section; hiding it by default hides the feature. No skeleton rows: nothing can have been opened while the index builds, so the section shows its empty state throughout.

### D7 Rows are resolved in `App` and passed to `Sidebar` as data

`Sidebar` holds no graph, so it cannot turn paths into titles. The trail becomes `{ path, title, materialized }[]` in `App`, memoized on (graph, trail, open page): `title` from the graph with `stem(path)` as the fallback, `materialized = graph.pages.has(path)`. This mirrors `MetaPanel`'s existing `LinkRow` contract. Rejected: storing titles in the trail (stale after an external rename) and handing `Sidebar` the graph (widens its props from page data to the whole index).

### D8 `memo(Sidebar)` plus a stable select handler, measured

For the memo to ever bail, every prop must be referentially stable. Inventory of what `App` currently passes:

```
  prop              today                                action
  ----------------  -----------------------------------  -----------------------
  pages             useMemo(graph, pins)                 stable
  journalEntries    useMemo(graph)                       stable
  activePath        string | null                        stable
  pinnedPaths       built.pins, or a fresh [] when the    FIX: module-level
                    graph is null                          EMPTY_PINS constant
  hasVault, loading booleans                             stable
  onSelect          plain arrow, new every render        FIX: useCallback
                    (reads only graph and drafts)          ([graph, drafts])
```

The two fixes are performance-only: they change no observable behavior and therefore belong in `design.md` and `tasks.md`, not in a spec. They were measured with the harness and the results recorded in Measurements below.

## Measurements

Harness: Chromium through `playwright-cli`, production build served by `vite preview`, a vault of **10,000 pages** in the Origin Private File System with `window.showDirectoryPicker` overridden to return it, 1600x900, page `page-1.md`, sidebar rendering 10,046 buttons. Two instruments, both injected rather than added to the app:

- An **interleaved A/B typing burst**: one bundle carried both sidebar variants behind a URL flag, so both could be measured in the same session, back to back, on the same page. This is the instrument the earlier gutter and reference work used (a 437-character burst through `page.keyboard.type`).
- A **CDP CPU profile** of the window after a burst, attributed by self time. React's own render appears as a handful of minified frames (`Jd`, `El`, `Zd`, `Jc`, `Vc`, `Fe`) that appear only when the sidebar renders; they are summed as `react-dom` below. Samples that caught the variant switch (a full 10k-row remount, identified by DOM-op time) are dropped.

Both instruments ran with the app's background index refresh frozen: the app gates its interval and visibility refresh on `document.visibilityState`, which the harness reports as `hidden`.

**1. The keystroke path carries no App render at all, memo or no memo.** The editor's markdown listener debounces, so `onChange` — and with it every React re-render — fires once per typing pause, not per keystroke. 437-character bursts, interleaved in one session:

| sidebar | burst runs (ms) | median | per character |
|---|---|---|---|
| memoized (shipped) | 1061, 993, 961, 936, 930, 907, 903, 893, 887, 870, 837, 826 | 907 | 2.08 ms |
| no memo | 932, 927, 912, 893, 852, 836, 834, 817 | 893 | 2.04 ms |

The two are the same within noise. The memo buys nothing on the keystroke path, because nothing about the sidebar is on it.

**2. What the memo removes is the debounced re-render.** CPU profile of the 650 ms window after a 40-character burst, medians of 5 pauses per round:

| sidebar | JS per pause | react-dom in it |
|---|---|---|
| no memo | 17.5 ms / 13.7 ms (rounds), 12.1-32.8 ms range | 10.6 ms / 8.1 ms |
| memoized | 3.6-6.8 ms | 0 ms |

The sidebar's re-render of 10,000 unchanged rows costs roughly 10 ms of React work per typing pause, and the memo removes all of it, taking a pause's total JS from about 15 ms to about 5 ms (what remains is the editor's own debounced serialization and the gutter). Real, once per pause, and small.

**3. The History section adds nothing measurable.** Same instrument, worst case (memo removed, so the sidebar does re-render), with and without the section, two rounds of 5 pauses:

| sidebar | JS per pause, round 1 | round 2 |
|---|---|---|
| with History | 17.5 ms | 13.7 ms |
| without History | 12.6 ms | 16.6 ms |

The sign flips between rounds: the difference is inside a window whose samples span 9.6-20.5 ms, against an expected size of about 0.02 ms (20 rows against the 10,000 the same render costs 6-17 ms for). In the shipped build the sidebar does not re-render during a pause at all, so the section cannot cost anything there.

**4. The sidebar's real cost is its mount, not its re-render.** The same profile of one full remount of the 10,000-row sidebar: **5,358-5,385 ms of DOM work** (`appendChild` about 3.2 s, `setAttribute` about 2.1 s). That is 5.4 seconds to first paint of a 10k-page sidebar, against 15 ms per typing pause. It is pre-existing (the Pages list always mounted at vault size), the memo does not touch it, and it is the largest sidebar cost measured here by a factor of 350. Recorded as a follow-up rather than fixed here: the lever is windowing the Pages list, not memoization.

Wall-clock numbers on a shared machine move together by up to about 1.5x between runs (the earlier gutter work documented the same); the comparisons above are interleaved or profiled for that reason, and the ratios are what they are for.

## Risks / Trade-offs

- [AGENTS.md's keystroke budget is quoted against a debounced render] → the editor's listener debounces, so the sidebar's re-render lands once per typing pause, not per keystroke (Measurements 1). The budget still applies to what is genuinely per keystroke, and the memo is kept for the pause; the wording in `Context` above is left as the honest statement of what was believed before the profile.
- [The memo silently stops bailing after a future prop becomes unstable, and nobody notices] → keep the prop-stability inventory as a comment on `Sidebar`, and re-run the measurement whenever the sidebar's props change.
- [`useCallback` on the select handler risks a stale closure] → its dependency list is exactly what it reads (`graph`, `drafts`); it must not be widened to `activePath`, which it does not read.
- [A reload loses the trail] → accepted. A reload already re-opens today's journal, so the trail resetting reads as a new session. `sessionStorage` is the contained upgrade if this grates, and it needs one new spec sentence.
- [The section pushes the Pages list below the fold] → cap 20, and the sidebar stays one scroll region with no nested scroll or height cap of its own.
- [A row can point at a file deleted since it was opened] → the row renders dimmed with the `stem()` title and still opens, which is the same rule the links pane already applies to unmaterialized targets.
- [The numbers do not improve] → measured (Measurements 1-2): the memo does not change the keystroke path, because nothing about the sidebar is on it, and it removes about 10 ms of React work per typing pause. It is kept because it costs nothing behaviorally and removes real work; the pause is where the win is, not the keystroke.

## Migration Plan

None. No storage format, no on-disk state, no data to migrate, and nothing written to a vault. Reverting the commit restores the previous behavior completely.

## Open Questions

- The scope sentence in the History section's empty state is not fixed beyond the "Nothing here yet." headline. Exact wording can be settled during implementation without changing the specs or the approach.
- Windowing the Pages list: measured at 5.4 s to mount 10,000 rows (Measurements 4). Not this change. Recorded in `PLAN.md` under Later ideas, to revisit only if a vault that large is real.
