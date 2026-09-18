## Why

When a page outgrows the editor pane, a scrollbar appears and the text column narrows by the scrollbar's width. The text reflows mid-sentence. The same happens in the sidebar and meta panel bands when a listing crosses its band's height, and in the search results list. Typing into a long note is therefore punctuated by the document shifting sideways, and the shift is irreversible in the other direction: the page narrows and never widens back.

Every scroll region the app owns was written as a bare `overflow-y: auto`, so none of them reserves the space its scrollbar will occupy. One region — the search dropdown — opts into `scrollbar-gutter: stable` already, which is the fix, applied to one region out of seven.

## What Changes

- **Every scroll region the app owns reserves its scrollbar's gutter**, so content keeps its width whether or not a scrollbar is present. `scrollbar-gutter: stable` on the editor pane, the sidebar pane and its two listing bodies, the meta panel and its three listing bodies, and the search results list.
- **Two regions deliberately opt out.** The folder rail is a fixed 56px column holding 40px controls, so a reserved lane would clip them; the code block's language popup is an overlay whose width is content-sized.
- **Nothing about a scrollbar's appearance changes.** The bars stay the platform's own — no colour, no width, no transparency, no custom thumb. This change moves content, it does not restyle a native control.
- **The rule gets written down once.** `DESIGN.md` gains a short "Scroll regions" section, because it has none today, which is why each region chose its own default.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the shell's panes and banded listings reserve their scrollbar gutter, so a region's content does not change width when it begins to overflow. A new requirement, alongside the existing pane and band requirements it applies to.

## Non-goals

- **No scrollbar styling.** No colour, no thickness, no transparency, no `::-webkit-scrollbar` rule, no `scrollbar-color` or `scrollbar-width`. The bars remain the platform's native ones.
- **No overlay scrollbars, and no custom scrollbar.** No thumb element, no scroll listener, no component wrapping a scroll region. A scrollbar that floats on top of content is not achievable in CSS for a classic-scrollbar platform (`overflow: overlay` was removed in Chrome 114), and replacing the native control with our own is a different, larger decision.
- **No change to the folder rail's width or its avatars.** The rail opts out. The latent clipping it already has once it scrolls is noted, not fixed here.
- **No horizontal scrollbar treatment.** `scrollbar-gutter` reserves the vertical lane only; nothing changes for a region that scrolls sideways.
- **No change to any scroll region's scrolling behaviour**: no auto-scroll, no scroll-into-view, no sticky behaviour, no measurement, no windowing. The gutter is layout, not behaviour.
- **No new dependency, no JS, and nothing on the keyboard or scroll path.**
- **No ADR.** Nothing architectural is decided; the rule belongs in `DESIGN.md`, which is where the app keeps its styling contract.

## Impact

- CSS only, in `src/components/EditorPane.module.css`, `src/components/Sidebar.module.css`, `src/components/MetaPanel.module.css`, and `src/components/SearchResultsView.module.css`. One declaration per region, and `src/components/SearchBox.module.css` already reserves.
- `DESIGN.md` gains the "Scroll regions" rule.
- `src/scrollRegions.test.ts` (new) enforces the rule at the source: a scroll region that forgets its gutter fails the suite instead of showing up as a reflow in a browser. The stylesheets have to be read from disk because vitest replaces a CSS-module import with a proxy of class names. `tsconfig.app.json` gains `node` in its `types` so that this one file can read them; nothing else under `src` uses a Node API, and the app itself still touches no filesystem.
- No dependency, and no change to any component's DOM or props. The banded panes keep their measured geometry exactly: a reserved gutter changes a band body's content width, never its box, so `pageWindow`'s measurements and the sidebar's windowing are untouched.
- Cost: each included region's content is permanently narrower by the platform's scrollbar width (about 11-17px on Windows, nothing at all where overlay scrollbars are used, because a gutter is not reserved for them).
- Specs: `ui-shell` (delta). `PLAN.md` gains one numbered task, and `package.json` 0.14.0 → 0.14.1 (a layout fix, not a new capability).
