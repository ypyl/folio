# Proposal

## Why

The compact shell's footer is two 48×48 islands at the screen edges with the save
state between them. Measured against Material 3, that meets the 48dp minimum
touch target but is not a navigation bar: Google's navigation bar has three to
five destinations, is 64dp tall, and gives each destination an equal-width
segment with a 56×32 active indicator. Ours has two destinations, is 56px tall,
and leaves 77% of its width as status text. Each destination therefore gets 48px
of width, about 12% of the screen, where a navigation bar would give it a third.
That is why it feels small even though the target clears the minimum. The save
state also sits inside a navigation control's row, which is a status bar's job,
not a navigation bar's.

## What Changes

- **A 64px compact navigation bar with three equal destinations**: Notes, Page,
  and Details. Each destination is a third of the width and the full 64px tall,
  with a 24px icon, a 12px label, and a 56×32 active indicator in `--brand-tint`
  behind the active icon. The active icon and label take the brand ink. The bar
  is the footer at compact only; the wide status bar is untouched.
- **The save state moves to the app bar.** The compact app bar grows from 56 to
  64px: the 16px title keeps its 48px locate target, and a 12px status line under
  it reads "Unsaved changes", "Saving…", "Save failed", or "Indexing notes…" as
  a live region. The brand screen shows no status line.
- **The destinations select their view.** Tapping Notes, Page, or Details shows
  that view; the destination already shown does nothing. The editor remains the
  base: selecting it returns there, and the Android Back step still returns to
  the editor from either other view. Switching between Notes and Details adds no
  history entry, so Back never needs two presses.
- **The wide composition is unchanged**: the same three panes, pointer-sized
  controls, breadcrumb, save state, folder statistics, and version badge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the compact footer becomes a three-destination navigation bar,
  the compact app bar carries the save state, the view-selection and history
  rules change from toggling two controls to selecting three destinations, and
  the touch-target and type rules name the new bar. The wide status bar's
  requirement is re-stated without its compact clauses.

## Non-goals

- **No wide-composition change.** The navigation bar and the compact app bar are
  rendered only at the compact breakpoint.
- **No navigation rail for tablets.** A viewport wider than 640px stays on the
  three-pane shell; a rail for the 640–840px range would be its own change.
- **No drawer, sheet, or list-to-page stack.** The three views stay as they are.
- **No new dependency, icon package, or theme.** The icons are inline SVG; the
  palette is the existing tokens.
- **No experimental switch.** This completes the compact shell's navigation; it
  adds no new capability behind a flag.
- **No text-scaling change.** The px scale stays; a 200% pass is a separate
  accessibility change.

## Impact

- **A new `CompactNavBar` component** and its stylesheet, plus `StatusBar`
  becoming wide-only (its compact mode, controls, and glyph move out).
- **`src/App.tsx`** for the third destination, the selection and history rules,
  and the save-state line handed to `CompactBar`.
- **`src/components/CompactBar.tsx` / `.css`** for the 64px bar and its status
  line; **a small save-state label helper** shared by the two bars.
- **Specs, tests, and `DESIGN.md`**; version takes a minor bump.
