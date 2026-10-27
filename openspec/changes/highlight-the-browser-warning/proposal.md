# Proposal

## Why

Folio only opens local folders in Chromium-based browsers. When someone opens the
live build in Firefox or Safari, that requirement is currently the same quiet
tagline line the app uses everywhere else: same size, same weight, and no
warning treatment. A visitor can read the page, miss the sentence, and conclude
the app is broken when the folder picker is missing.

## What Changes

- The unsupported-browser state becomes a warning callout, not a tagline: a
  warning surface, a warning icon, a short heading naming the browsers, and the
  reason in body text.
- The warning names Chrome, Edge, and Brave, and points at the guided demo, which
  still works in any browser.
- The warning appears only where the File System Access API is unavailable. The
  supported-browser state keeps its existing tagline and controls.
- New warning tokens `--breaking-bg` and `--breaking-fg`, already specified in
  DESIGN.md, are defined in the app and used for this callout. DESIGN.md records
  this as the warning tint's second use.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the no-folder state gains a distinct unsupported-browser warning
  that names the supported browsers and stands apart from the tagline.

## Impact

- `src/components/EditorPane.tsx` and `EditorPane.module.css`: the warning
  callout and its styles.
- `src/index.css`: the two warning tokens from DESIGN.md.
- `DESIGN.md`: the warning tint's use for the browser requirement.
- Tests: `EditorPane.integration.test.tsx`, `App.integration.test.tsx`, and
  `tests/e2e/demo.spec.ts`.
- No folder, storage, or editor behavior changes. The demo remains available
  where the picker is not.

## Non-goals

- No browser sniffing or user-agent check: the warning follows the capability
  the app actually needs, exactly as the picker does.
- No download links, redirects, or "open in Chrome" flow.
- No change to the supported-browser brand screen, the tour, or the demo.
- No new dependency and no backend.
