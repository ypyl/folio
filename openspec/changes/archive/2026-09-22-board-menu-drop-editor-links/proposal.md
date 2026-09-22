## Why

The board editor's main menu carries the editor library's own project links — GitHub, X (Twitter), and Discord, under an "Excalidraw links" heading. Folio is not the Excalidraw project and has no GitHub or community presence to send people to, so on an app whose every other surface is the user's own vault those outbound links are noise and a dead end.

## What Changes

- The board editor's main menu no longer offers the "Excalidraw links" group: its GitHub, X (Twitter), and Discord links, and the group's heading and its separator.
- Every other menu item keeps its place and behavior, and the toolbar, tools, canvas, palette, and all other chrome are untouched.

### Non-goals

- Not the editor's Help dialog (its "Found an issue? Submit" GitHub link), its Brave-fingerprinting notice (a Discord link), or its library panel (the publication form asks for GitHub/Twitter handles). This change is the main menu only.
- No change to the editor's layout, icons, canvas rendering, or drawing fonts.
- No new ADR: this is chrome trimming under the existing board rules (ADR-0024) and the "keep it small" guardrail (ADR-0006), not a new architectural decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: a new requirement that the board editor's main menu offers no links to the editor library's own project (GitHub, X/Twitter, Discord).

## Impact

- `src/editor/boardView.tsx` — supply the editor's own `MainMenu` (its public customization API) so the menu renders the app's chosen items and omits the project-link group.
- No new dependency, no vault-index change, no filesystem change, no keystroke-path cost (menu markup, rendered on demand only).
- Version-fragile against the editor package's `MainMenu.DefaultItems` exports; a browser check covers it, and a package upgrade that moves those names degrades to a stock or missing menu rather than breaking the board.
