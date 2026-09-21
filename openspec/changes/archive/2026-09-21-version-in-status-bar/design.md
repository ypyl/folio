## Context

The previous change put the version in the meta panel. The status bar (`StatusBar.tsx`) is the app's bottom row: a leading pin column, then the path group, the status group, and the vault group (name and file count) pinned right by `margin-left: auto`, with the `.bar` flex `gap: 10px` separating its items. The version already moved out of the header, so the status bar is the one surface that frames every state and holds the vault's file count.

## Goals / Non-Goals

**Goals:** the badge reads beside the vault's file count at the bar's trailing edge, in every state; the meta panel returns exactly to its pre-move state.

**Non-Goals:** touching the vault group's own content, its title tooltip, or the bar's other groups.

## Decisions

**The badge is its own flex item after the vault group, not inside it.** The vault group is specified to be empty when no folder is active; putting the badge inside would break that invariant and join the badge to the `notes (12 files)` tooltip. As a sibling it reads directly beside the count, sits at the trailing edge via the group's `margin-left: auto`, and leaves the vault group's emptiness intact. The bar's own `gap` spaces it.

**Revert the meta panel rather than leave dead markup.** Deleting the badge means the bottom-anchored group the last change introduced (the wrapper holding the shortcuts details and the badge) has one child; the panel goes back to the plain sticky details from before, and its tests go back with it, keeping the diff to the surfaces that actually change.

## Risks / Trade-offs

- **The badge renders with no vault open** → intended: it is build identity, and the requirement says it renders in every app state. It simply sits alone at the trailing edge until a vault fills the group beside it.
