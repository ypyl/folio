# Proposal

## Why

The right panel opens with both Contents and Links expanded, so the Links band
takes the panel's remaining height before the user has asked for anything. On a
page whose links matter, that is the room they want; on the ordinary page it is a
list most readers never open, sitting between them and the shortcuts reference.

The panel is an accordion, so the reader can already close links. The default
just guesses wrong for the common case: the page's own shape (Contents) is what a
reader arrives for, and Links is the reference they open when they want it.

## What Changes

- **Links starts collapsed.** Opening a page shows Contents, and Links is its
  summary row until the reader opens it. The shortcut row stays collapsed, as
  it already was.
- **When Links is closed, Contents takes the height it gave up.** The existing
  spec already said so, but the closed band used to leave that height empty above
  itself; with Links closed by default that hole would be the panel's usual look,
  so the closed case now really does grow Contents.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `workspace`: the right panel's accordion opens Contents and collapses Links.

## Non-goals

- No change to what either section lists, or to the boards' Referenced by band.
- No persistence of a section's open state across pages or reloads: the default
  is the default, and a reader who opens Links still opens it per page.
- No change to the keyboard reference, which was already collapsed.

## Impact

- `src/components/MetaPanel.tsx`: the Links section drops `defaultOpen`.
- `src/components/MetaPanel.module.css`: the closed Links band sizes to its
  summary row, and Contents grows in its place.
- Tests: the panel's default-state test and the App suite's Links helper.
- Version bump: a minor bump (the panel's default changes for everyone).
