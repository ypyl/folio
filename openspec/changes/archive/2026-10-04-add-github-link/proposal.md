# Proposal

## Why

Folio is open source, but someone who opens the app has no way to find its
repository, read the source, or report a problem. The brand screen is the one
place every user sees before a folder is open, so the project link belongs
there.

## What Changes

- Add a link to the public repository (`https://github.com/ypyl/folio`) to the
  no-folder brand screen, placed after the "Import from Logseq" action's
  position.
- The link opens the repository in a new browser tab and never navigates the app
  away from its screen.
- The link is shown in every no-folder state — both where the browser can open
  local folders and where it cannot — so the repository stays reachable even
  where the import action is not offered. (Assumption: the request anchors the
  link after the import action, but the repository is useful regardless of the
  picker, so it is not gated on the import action's availability.)

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the no-folder brand screen gains a link to the project's public
  repository.

## Impact

- `src/components/EditorPane.tsx` (the brand screen) and its stylesheet, with
  the link wired from `src/App.tsx`. No new dependency and no architectural
  change, so no ADR.
- Existing brand-screen tests and the e2e `workspace` happy path gain one
  assertion.

## Non-goals

- Not a general "about" page, and not a menu of external links.
- Does not add a link anywhere but the no-folder brand screen (not the folder
  rail, the status bar, or the right panel).
- Does not change any app state, navigation, or the import flow itself.
