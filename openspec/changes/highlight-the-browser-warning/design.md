# Design

## Context

See proposal.md - Why. `EditorPane` already chooses its no-folder copy from
`emptyHint`; the unsupported state is the `browser-unsupported` variant and
currently prints one long string in `.tagline` with a slightly darker color.
The capability probe is `canOpenFolders()`, so the condition is exactly right;
only the presentation is wrong.

## Goals / Non-Goals

**Goals:**
- Make the browser requirement read as a warning, not supporting copy.
- Name the browsers a visitor can switch to.
- Keep the guided demo offered in that state.

**Non-Goals:**
- No user-agent detection.
- No new browser-opening flow or downloads.
- No change to a supported browser's brand screen.

## Decisions

**The warning is a callout with a heading, body, and icon.** A larger title
("Chrome, Edge, or Brave required"), a short reason, and a warning glyph give
the state a shape a reader recognizes before reading a word. Keeping the single
tagline line and recoloring it was rejected: color alone is the weakest signal,
and the existing line was already a different color.

**Use the sanctioned warning tint.** DESIGN.md already defines `--breaking-bg`
and `--breaking-fg` as the one approved exception to the ink-blue-only rule. The
tokens are not yet in `index.css`, so this change defines them and uses them for
the warning surface. The alternative, a brand-tinted card, is too quiet for a
blocking condition. DESIGN.md gains one sentence recording the browser warning
as the tint's second use, so the exception stays documented rather than
implicit.

**The demo line moves into the warning body.** The warning says a Chromium
browser is needed for local folders and that the guided demo still works here.
The demo button stays where it is, below the brand description, so the warning
and the action are adjacent without turning the warning into a control.

**The warning is static markup.** No state, no effect, no dismissal. It renders
only when `emptyHint === 'browser-unsupported'`, which is already a render-time
capability check. It writes nothing.

## Risks / Trade-offs

- [The warning tint is a second chromatic color] -> it is the one sanctioned
  warning color, now documented as also serving this blocking warning; the rest
  of the app stays ink-blue only.
- [A warning card takes more vertical space than one line] -> it replaces the
  line only in the unsupported state, where the extra prominence is the point.
- [The copy can drift from what the app actually supports] -> the supported
  browsers are the ones the capability check targets, and the copy names the
  same three the README and the existing requirement name.
