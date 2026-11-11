# Proposal

## Why

The compact shell's type is at the bottom of the mobile range: 16px body and list
rows, 14px secondary text and calendar days, 12px labels. On a 6.3-inch phone
that reads small, and the reader of a notes app is reading for minutes at a
time, not glancing at chrome. The last review sized the shell to the web floor;
this change moves it into the reading range the platform's own notes apps use.

## What Changes

- **One step up across the compact scale**: editor body 18px with 1.3em
  headings, list and meta rows 17px, app bar title 18px, status line and section
  labels 13px, calendar days 16px and month 17px, nav labels 13px, buttons 17px,
  secondary text 15px, badges 12px, and no text below 12px.
- **Rows grow to 56px** so 17px text keeps its line height and the touch target
  stays comfortable; the windowed listing's stride follows at 58px.
- **The 64px bars stay**: the app bar's title keeps its 48px locate target and
  the 13px status line sits under it; the navigation bar keeps its 64px height,
  56×32 indicator, and full-height destinations.
- **The wide composition is untouched.**

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the compact type scale's values, the Files row height and its
  reading of the stride, and the type sizes named in the app bar and navigation
  bar requirements.

## Non-goals

- No layout or navigation change; the three destinations, the app bar actions,
  and the wide shell stay as they are.
- No font family change, no serif adoption, no rem/root-scale rewrite.
- No wide-composition type change.
- No new dependency or theme, and no experimental switch.

## Impact

- The component stylesheets that declare the compact scale, the editor's compact
  override, the row stride in `pageWindow.ts`, `DESIGN.md`, and the type-scale
  e2e case. Version takes a minor bump.
