# Design

## Context

See `proposal.md` for motivation. The rail (`FolderRail.tsx`) is the shell's
leading 56px column: the brand, the search trigger, the add control, one entry per
open folder, and a bottom group (`.railBottom`) that holds the tour control and is
pinned to the rail's bottom edge. The rail renders in both compositions: the wide
grid places it beside the sidebar, and the compact shell's navigation view stacks
it with the sidebar at full width (`index.css`, `.layer-nav`). App decides whether
a control exists by passing an optional callback, which is how the tour is wide
only today. Nothing in the rail writes state, and nothing in the rail needs a
folder to render: the tour control is available with no folder open.

## Goals / Non-Goals

**Goals:**

- One always-available way out of the app to the issue tracker, reachable in both
  compositions, at the same weight as the rail's other controls.
- An issue page that arrives with the facts a report needs.
- Zero state, zero network, zero new dependency.

**Non-Goals:**

- No in-app form, no prefilled report body, no version in the URL.
- No change to the tour control, other than the feedback control sitting above it.
- No ADR: this is a link plus repository text, not an architectural decision.

## Decisions

**The control is an `<a>`, not a `<button>` with `window.open`.** It navigates to
another origin, so it should be a link: middle-click, "open in new tab", the
status-bar URL preview on hover, and the browser's own new-tab handling come for
free, and no popup blocker is involved. `target="_blank"` with
`rel="noopener noreferrer"` keeps the app in place. The rail's other controls stay
buttons because they act inside the app.

**The destination is the issue chooser (`/issues/new/choose`), not one template.**
A single link cannot open two forms, and opening the bug form from a button that
says "feedback" would hide the feature-request path. The chooser is GitHub's own
page listing both forms, so the choice happens where the writing happens. The
browser can reach that page only while online, which is inherent to reporting.

**The control has no `App` callback.** Unlike the tour, it needs no state, no
handler, and nothing from `App`; the rail owns the URL as a module constant so it
renders in every state and in both compositions without a prop. A callback that
every caller passes unconditionally would be ceremony around one anchor.

**It sits above the tour control.** The bottom group is the rail's utility
corner. The tour control is documented, tested, and styled as the rail's last
control, so adding the feedback control above it adds one row and moves nothing,
and the column's last mark stays the one that belongs to the app. On compact,
where no tour control exists, the group holds the feedback control alone.

**The glyph is a speech bubble drawn inline in the app's own stroke style, 20px,
mirroring the search trigger.** The rail's other controls show text glyphs
(`?`, `+`, `×`), but no ASCII character reads as "feedback" without a word; the
search trigger already establishes an inline SVG as the rail's icon pattern. It
takes the tour control's surface (hairline border, `--ivory` fill, `--dark-warm`
ink), brand tint and brand ink on hover, and the rail's 40px box, 48px on the
compact shell. Accessible name: "Send feedback on GitHub".

**The templates are GitHub issue forms, not Markdown templates.** Forms make the
report's facts required fields, so a report cannot arrive without the build and the
browser. Bug report: what happened, steps to reproduce, Folio version (the version
badge's `v<version>`, optional because the compact shell shows no badge), browser,
console errors. Feature request: the problem, the proposed behavior,
alternatives. Titles are prefilled with a plain prefix (`[Bug] `, `[Feature] `)
rather than a conventional-commit prefix, because an issue is not a commit.
`config.yml` turns blank issues off so every report gets a form, and its contact
link points at the live build for anyone who has not tried the demo.

## Risks / Trade-offs

- [A form's required fields can deter a quick report] → only what the maintainer
  cannot reconstruct is required: for a bug, what happened and the browser; for a
  feature, the problem. Version stays optional because the compact shell has no
  badge to read it from.
- [A control in the rail's bottom group steals height from a long folder list] →
  the group is sticky and the list scrolls under it, the shape the tour control
  already has.
- [The link is dead offline, and the app is a PWA] → it opens a browser tab, and a
  tab with no connection shows the browser's own offline page. The app itself keeps
  working; nothing in the shell depends on the link.
- [`.layer-nav` puts the rail on the compact navigation view only] → the feedback
  control is on the same view as the folder list, which is where a user already
  goes; the brand screen's repository line remains the second reference.
