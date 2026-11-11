# Design

## Context

See `proposal.md` — Why. The compact scale is declared per component in the
compact media blocks, with the editor's base size overridden from the CodeMirror
theme. Rows are 52px (stride 54); the app bar is 64px with a 16px title and a
12px status line; the navigation bar is 64px with 12px labels. The wide shell
keeps its 15px editor and its pointer sizes.

## Goals / Non-Goals

**Goals**

- Notes text and list rows that are comfortable to read for minutes.
- Labels that are legible at arm's length without becoming headings.
- The same layout: 64px bars, 48px targets, the three destinations.

**Non-Goals**

- No layout change, no navigation change, no wide-composition change.
- No type-scale system (rem/root) and no user setting; this is one fixed step.

## Decisions

### D1: The values

| Role | Before | After |
|---|---|---|
| Editor body | 16 | 18 |
| Editor heading | 1.25em | 1.3em (23.4) |
| List and meta rows | 16 | 17 |
| App bar title | 16 | 18 |
| Status line, section labels, nav labels | 12 | 13 |
| Calendar day | 14 | 16 |
| Calendar weekday | 11 | 12 |
| Calendar month | 15 | 17 |
| Buttons | 16 | 17 |
| Secondary text (search descriptions, brand facts, rows' detail) | 14 | 15 |
| Brand description | 16 | 17 |
| Badges | 11 | 12 |
| Menu item | 15 | 16 |
| Shortcut label / chip | 15 / 13 | 16 / 14 |
| Icons | 24 | 24 |

The editor keeps a 1.55 line height (28px at 18), the mobile reading rhythm.
Nothing rises so far that a row's three-line meta layout or the calendar's
48px cell breaks: 16px numerals fit a 45px-wide cell, and a 13px nav label fits
its 64px destination.

Alternative considered: only the body (16→18) and nothing else. Rejected: the
12px labels and 14px calendar numbers are the other half of why the screen reads
small, and the app bar title should not be smaller than the list it names.

### D2: Rows grow with their text

The Files row's minimum height goes from 52 to 56px, and the windowed listing's
`COMPACT_ROW_STRIDE` from 54 to 58. The row is still a single line with 17px
text; the extra 4px is breathing room, not a second line. The loading skeleton
follows the real row so a section does not jump when it lands.

### D3: The bars hold their geometry

The app bar stays 64px: the 18px title keeps a 48px locate target (its line box),
and the 13px status line uses a 16px line box under it. The navigation bar stays
64px: the 56×32 indicator and the 13px label fit the destination with 2px
between them. No target changes, so the touch rule and the safe-area rule are
untouched.

### D4: One fixed step, recorded in the design language

`DESIGN.md`'s compact type sentence gets the new values, including the 12px
floor. A root-relative scale (so the OS text setting can move it) is a separate
change; this one is a deliberate fixed step.

## Risks / Trade-offs

- **Shorter lines in the editor**: 18px in a 347px column gives about 38
  characters. → That is the reading size the platform's notes apps use on a
  phone; the gutter stays 32px, and the wide window keeps its 15px measure.
- **Fewer rows visible**: 56px rows show about one fewer item in the Files band.
  → The listing scrolls, and the rows are the point of the change.
- **The app bar's title could collide with the status line at 13px.** → The
  title is one line with a 48px box and the status a 16px box, both truncated;
  the bar's 64px height is unchanged and the e2e measures the title's box.
- **A larger scale exposes a fixed-height container.** → The calendar cells are
  48px with 16px numerals; the nav destination's 64px holds a 32px indicator and
  a 13px label; the bars are fixed and their contents fit. The browser check
  measures the computed sizes and the e2e the targets.

## Migration Plan

No data or stored state changes. The scale is CSS, the stride is arithmetic, and
rollback is a revert. Version takes a minor bump.
