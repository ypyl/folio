## Why

Folio opens a local folder with the File System Access API, which only Chromium browsers provide. Verified in Firefox 152: `window.showDirectoryPicker` is `undefined`, the shell renders, the rail still offers an "Add folder" button, and activating it does nothing — the failure is swallowed by the add flow's cancel handler, so the app looks broken rather than unsupported. The brand screen simultaneously tells the user to "Open a folder to begin", an instruction that browser cannot carry out. The rail should not offer the control, and the shell should say what the app needs instead.

## What Changes

- The rail renders its add control only when the browser provides the local-folder picker. Where it does not, the rail shows no add control, and the app never invokes the picker.
- The center pane's brand screen names the browser requirement in place of the open-folder tagline when the picker is missing, so the surface the user is looking at states what to do: a Chromium-based browser (Chrome, Edge, or Brave).
- The capability is probed once per render from the platform itself (feature detection), never from the user-agent string.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: "A folder rail lists opened folders and switches between them" — the add control becomes conditional on the browser providing the local-folder picker, with a scenario for its absence.
- `ui-shell`: "Empty state is a transient brand screen" — the brand screen states the browser requirement instead of the open-folder tagline when the app cannot open a local folder.

## Impact

- `src/vault/fs.ts` (the capability probe, next to the picker it guards), `src/App.tsx` (the probe becomes the rail's `onAdd` and the pane's empty hint), `src/components/FolderRail.tsx` and `src/components/EditorPane.tsx` (render the conditional control and the notice).
- `vault-storage` is unchanged: the picker factory's contract holds wherever it can be invoked, and after this change the only caller is a control that exists when the API does.
- Tests: `App.test.tsx` and `EditorPane.test.tsx` assert the open-folder tagline today, which is now the supported-browser case, and both need the picker stubbed; a new case covers the missing-picker path. No production behavior outside the notice and the rail control changes.
- No ADR: browser support is a platform fact, not an architectural decision (ADR-0003's storage boundary is untouched).
