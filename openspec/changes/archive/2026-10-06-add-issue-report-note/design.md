# Design

## Context

See `proposal.md`. The brand screen's repository area is a standalone `<a>`
whose visible text is "GitHub" and whose accessible name is "Folio on GitHub".
The brand screen renders in every no-folder state.

## Goals / Non-Goals

**Goals:**

- Tell the user where to report bugs and feature requests, next to the link.
- Keep the existing link behavior and accessible name.

**Non-Goals:**

- No second link, no tracker integration, no change to the link target.

## Decisions

**The link is inlined into the sentence rather than left as a standalone
link with a note above it.** A note saying "report it on GitHub" directly above
a bare "GitHub" link repeats itself. One sentence, with "GitHub" as the link,
reads once and acts once. The sentence replaces the standalone link, so the
repository area stays a single line.

Exact copy (subject to review): "Found a bug or have a feature request? Report
it on GitHub." where "GitHub" is the repository link.

**The accessible name stays "Folio on GitHub".** It still identifies the
repository, and it contains the visible text "GitHub", so the label-in-name rule
holds. The link keeps `target="_blank"` and `rel="noopener noreferrer"`.

**Styling reuses `.repoLink`** for the inline link and a new `.repoNote` for the
sentence, on the same centered measure as the rest of the brand screen.

## Risks / Trade-offs

- [Inline link's padding shifts the line] → it is a single short line; check it
  on the dev server.
