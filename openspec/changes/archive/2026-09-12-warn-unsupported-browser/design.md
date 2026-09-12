## Context

See `proposal.md` for why. Facts that shape the approach:

- `pickVaultFolder()` in `src/vault/fs.ts` is the only caller of `showDirectoryPicker`, and `useVault`'s `openNewFolder` wraps it in a bare `catch { return }` to treat a cancelled picker as a no-op — which is why a missing API looks like a dead button rather than an error.
- `FolderRail` renders the add control unconditionally (`src/components/FolderRail.tsx`) and already has a control-less state: `status === 'restoring'` returns an empty `<nav>`.
- The workspace grid is `grid-template-columns: var(--rail-w) var(--sidebar-w) minmax(0,1fr) var(--panel-w)`; the rail element must stay in the flow or the sidebar takes over the rail's column.
- `StatusBar` already uses the optional-callback pattern for a conditional control (`{onTogglePin && <button …/>}`), and `EditorPane` takes optional callbacks (`onDropFiles`, `onOpenReference`) the same way.
- `EditorPane`'s `emptyHint` is already a variant prop (`'notes' | 'open-folder'`) that decides the tagline; `App` computes it from the vault's state.
- Tests stub `showDirectoryPicker` per test with `vi.stubGlobal`, and every `App.test.tsx` test ends with `vi.unstubAllGlobals()`. jsdom provides no picker, so an unstubbed test is the unsupported case.

## Goals / Non-Goals

**Goals:**

- One probe, read at render time, from the platform API itself.
- No new prop plumbing beyond what `App` already computes, and no vault import in the two presentational components.
- The unsupported case is reachable in tests without a browser matrix.

**Non-Goals:**

- No user-agent sniffing, no browser allow-list, and no attempt to distinguish Chromium variants.
- No handling of a Chromium build where the API exists but the call is blocked by an embedder policy: the probe answers "does this runtime provide the picker", and a call that fails still flows through the existing cancel path.
- No change to `pickVaultFolder`, `useVault`, or the storage layer.
- No warning outside the brand screen: no banner, no status-bar note, no modal.
- No change to Safari-specific messaging (the same probe covers it).

## Decisions

### D1 Feature detection on `window`, read at render time

`src/vault/fs.ts` gains:

```ts
export function canOpenFolders(): boolean {
  return typeof (window as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
}
```

It sits next to the picker it guards, so the two are read together, and it is a function rather than a module-level constant: a constant would be evaluated at import time, before a test's `vi.stubGlobal` and before any late polyfill, and would make the probe's answer depend on import order. The cast is needed because TypeScript 6's DOM lib no longer declares the API.

Rejected: `navigator.userAgent` matching. It is a guess about the platform rather than a question to it, it breaks on Chromium-based browsers that are not Chrome/Edge/Brave, and it cannot be stubbed per test as cleanly.

Rejected: `'showDirectoryPicker' in window`. It would accept a property that exists but is not callable.

### D2 App probes once and encodes the answer in what it already passes down

`App` calls `canOpenFolders()` while rendering and uses the result twice: it passes `onAdd` only when true, and it passes the new `emptyHint` variant when false. So:

- `FolderRail` renders the control as `{onAdd && <button …/>}` — the same shape `StatusBar` uses for the pin, and its `onAdd` prop becomes optional.
- `EditorPane`'s hint union becomes `'notes' | 'open-folder' | 'browser-unsupported'`, deciding only which copy the brand screen shows.

This keeps both components presentational: neither imports the vault, and the capability lives in one place. `App` already owns the vault state that produces the hint, so the probe extends an existing computation rather than adding a new prop.

Rejected: probing inside `FolderRail` and `EditorPane`. It would put a vault module import inside the editor pane, blurring the editor/knowledge-management boundary (ADR-0010), and would evaluate the platform twice per render.

### D3 The notice replaces the tagline on the brand screen

The brand screen is the only surface a user can reach in a browser that cannot open folders — there is no vault, so every other pane is empty or disabled — so it is where the requirement has to be stated. It takes the tagline slot rather than appearing beside it: "Open a folder to begin." is a dead instruction there, and two lines of copy saying opposite things is worse than one correct line.

Copy: "Folio needs a Chromium-based browser to open a local folder. Use Chrome, Edge, or Brave." It names the requirement first and the concrete browsers second, uses no color beyond the Kami stone text, and is a plain paragraph, not an alert: it is static screen content, so it needs no live-region role.

Alternative rejected: a dismissible banner or modal. It is one extra component, an extra piece of persisted UI state, and it can be dismissed into a state where the app looks broken again with no explanation.

### D4 The rail keeps its column and loses only the control

The rail element stays in the DOM as an empty `<nav>`, which is a state it already has while stored folders resolve. Removing the element would slide the sidebar into the rail's grid column and break the shell's alignment.

### D5 Nothing else is gated

The rest of the shell is already inert without a vault: the search input is disabled, Back, Forward and Today are disabled, the calendar does not render, the pin is disabled, and the status bar's groups are empty. So the add control was the only control promising an action the runtime cannot perform, and no other guard is added.

## Risks / Trade-offs

- [The probe is read per render rather than memoized] → It is one `typeof` on a property; the same order of cost as the optional-callback checks in the same components, and far below the keystroke budget (no keystroke triggers a shell re-render).
- [A Chromium browser with the API present but blocked by policy still offers the control] → Out of scope (Non-Goals); the click is harmless and flows through the existing cancel path.
- [Tests that assert the open-folder tagline must now stub the picker] → Intended: they assert the supported case, and the new unsupported case is exactly the unstubbed environment. Recorded in the tasks.

## Migration Plan

None. No persisted state, no data shape, no storage change.
