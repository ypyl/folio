# Design

## Context

See proposal.md — Why. The popup is CodeMirror's tooltip, rendered inside
`.cm-editor`. Its markup and its stock theme are the library's:

- `.cm-tooltip.cm-tooltip-autocomplete` — the surface (CM's base theme gives it
  a border and a background).
- `.cm-tooltip-autocomplete > ul` — the list (monospace, `min-width: 250px`,
  `max-width: min(700px, 95vw)`, `max-height: 10em`, `overflow: hidden auto`).
- `.cm-tooltip-autocomplete > ul > li` — a row (`1px 3px` padding).
- `li[aria-selected]` — the active row (CM's light theme paints it `#17c` with
  white text).

The editor's presentation already has two places to hang CSS: `folioTheme` in
`src/editor/codemirror.ts`, which mirrors DESIGN.md's hex values, and
`src/components/EditorPane.module.css`, which scopes `.editor :global(...)`
rules and reads the design tokens (`--ivory`, `--warm-sand`, `--border`). The
pane stylesheet already styles CodeMirror output this way (`.cm-content::before`,
`.folio-search-hit`, `.ref`, `.folio-image`).

## Goals / Non-Goals

**Goals:**

- The popup and its rows look like the app's other floating menus.
- One source for the colors: the DESIGN.md tokens, not a second copy.
- A guard that fails when a CodeMirror upgrade renames the hooks this rests on.

**Non-Goals:**

- No change to the popup's markup, options, or behavior.
- No restyling of CM's other tooltips (the completion-info panel), which this
  app never opens.
- No dark variant, no new tokens, no new dependency.

## Decisions

**D1 — Style in `EditorPane.module.css`, not `folioTheme`.** The rules go under
`.editor :global(.cm-tooltip-autocomplete ...)` and use the CSS variables, the
same way the pane styles the rest of the editor's rendered DOM. `folioTheme` was
the alternative; rejected because it takes literal hex to match DESIGN.md, so
the popup's colors would be a second copy that can drift. (The e2e test runs the
real stylesheet, so the tokens resolve there.)

**D2 — Reuse the app's floating-menu recipe verbatim.** The popup takes the same
values as the row context menu and the language picker: `--ivory` fill, no
border, 4px padding, 8px radius, `0 4px 12px rgba(20,20,19,0.1)` whisper shadow;
rows at `6px 8px`, 6px radius, 13px, `--near-black`; active row `--warm-sand`.
Reusing the recipe rather than inventing a popup-specific one is the point:
DESIGN.md wants one treatment for floating surfaces. A brand-tinted active row
was considered and rejected — the app answers "which row is active" with warm
sand everywhere else, and an ink-blue fill would spend the ≤5% accent on a list
row.

**D3 — Override the stock active row, scoped to the autocomplete tooltip.**
CM's base theme sets `li[aria-selected]` to `#17c`/white. The override targets
`.cm-tooltip.cm-tooltip-autocomplete ... li[aria-selected]` so it also can't
touch CM's other tooltips, and it is verified by computed style in the browser
(a base-theme rule of equal specificity is the one thing that could win).

**D4 — Keep CM's list geometry, change only the type.** The popup stays
content-sized with CM's own `min-width`/`max-width`/`max-height` and its
ellipsis for a long name; only the list's `font-family` is reset from monospace
to the app's UI type. The list keeps the platform scrollbar: DESIGN.md's
scroll-region rule puts an overlay popup whose width comes from its content
outside the reserved lane and the custom thumb, exactly as the language picker
already is.

## Risks / Trade-offs

- **CM's class names are unversioned.** A dependency upgrade can rename
  `.cm-tooltip-autocomplete`, silently reverting the popup to the stock theme →
  the e2e test asserts a computed value on `.cm-tooltip-autocomplete`; a rename
  fails the suite instead of the styling.
- **A base-theme rule could tie on specificity.** CM's `li[aria-selected]` rule
  is `&light`-scoped → verified by the computed-style assertion; D3's selector
  is already more specific, and it can be raised further if a future base theme
  tightens.
- **The popup is also CM's generic tooltip.** Styling `.cm-tooltip` broadly
  could catch other tooltips → every rule is scoped under
  `.cm-tooltip-autocomplete`.
