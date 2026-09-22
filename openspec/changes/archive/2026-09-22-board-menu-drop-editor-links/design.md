## Context

See proposal.md — Why. `BoardView` mounts the editor's `<Excalidraw>` with no children (`src/editor/boardView.tsx`), so the library renders its own fallback main menu: open, save, export, save-as-image, find-on-canvas, help, clear canvas, a separator, a group titled "Excalidraw links" wrapping its `Socials` item (GitHub, X, Discord), a separator, theme, and canvas background. That group is the only place the menu links out to the editor library's own project.

Two ways to drop it: hide the group with CSS under the board scope, or supply the library's exported `MainMenu` as a child (children replace the fallback).

## Goals / Non-Goals

**Goals:** the group is gone, every other menu item keeps its place and behavior, and the change stays small and off the keystroke path.

**Non-Goals:** re-theming or restructuring the menu; touching the Help dialog, the browser notices, or the library panel.

## Decisions

**Replace the fallback through the exported `MainMenu`, not CSS.** The library exports `MainMenu` with its `DefaultItems` exactly for this customization, and supplying children makes it suppress its own fallback. The host renders the fallback's items minus the project-link group and its separator:

```
<MainMenu>
  <MainMenu.DefaultItems.LoadScene />
  <MainMenu.DefaultItems.SaveToActiveFile />
  <MainMenu.DefaultItems.Export />
  <MainMenu.DefaultItems.SaveAsImage />
  <MainMenu.DefaultItems.SearchMenu />
  <MainMenu.DefaultItems.Help />
  <MainMenu.DefaultItems.ClearCanvas />
  <MainMenu.Separator />
  <MainMenu.DefaultItems.ToggleTheme />
  <MainMenu.DefaultItems.ChangeCanvasBackground />
</MainMenu>
```

Export and save-as-image are unconditional because `BoardView` passes no `UIOptions`, so the library's defaults (`export` on, `saveAsImage` on) always apply and the fallback's own conditionals are always true here.

Rejected: **CSS hiding the group.** The group is targetable with `:has(a[href^="https://github.com/excalidraw"])`, but the fallback's separators are anonymous `<div>`s with no class, so removing the group leaves a doubled hairline that needs a second structural `:has()` selector aimed at the previous sibling. That is a more brittle dependency on the library's DOM than the content seam it publishes for this purpose; the board-editor-chrome change made the same call, supported seam over DOM patching.

Rejected: **render only a subset** (say, theme and canvas background). The ask is to remove the project links, not to prune the menu; keeping every other item avoids a second, unrequested behavior change.

## Risks / Trade-offs

- The `DefaultItems` names are pinned to the library version (`^0.18.1`) → a browser check asserts the surviving items and the absence of the links; if a name moves, the menu drops an item visibly rather than corrupting the board.
- A custom menu replaces the fallback, so a future library release that adds a default item will not show it until we add it → accepted: the app's menu stays deliberate instead of gaining surprise items.
- No keystroke-path cost: the menu is React markup rendered only while open, touching no vault or document data.
