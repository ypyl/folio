# Design

## Context

See proposal.md — Why. The pieces that shape the approach:

- `StatusBar.tsx` imports `version` from `package.json` directly and renders it as
  the bar's last child, a `<span>`, only when not `compact`. The bar is the
  shell's second grid row (`grid-template-rows: 1fr auto`), with no clipping
  ancestor, so an absolutely positioned child can float above it.
- `RowContextMenu` is the app's only floating surface, and it solves the
  dismissals already: `pointerdown` captured on the document, `scroll`, window
  `blur`, and `resize`. It is positioned `fixed` from an invocation point
  because a row's context has to escape a scrolling list. The status bar sits at
  the viewport's bottom edge, so it needs none of that.
- The repo commits one change per pair of commits, each with a conventional
  subject (`feat: …`, `fix: …`, `chore: archive …`), and bumps
  `package.json`'s version every commit. The subjects are the only user-facing
  record of what shipped.
- GitHub Pages builds from a default shallow checkout (`actions/checkout@v4`,
  no `fetch-depth`), so anything the build computes from git history would be
  one commit long in the published bundle.
- `vite/client` types are already in `tsconfig.app.json`, so a `?raw` import
  type-checks without a declaration, and vitest transforms it through the same
  pipeline.

## Goals / Non-Goals

**Goals:**

- The popover's contents are a build artifact the bundle carries, so the
  published app shows the same list with no git and no network.
- One way to regenerate the list, and no second hand-maintained copy.
- The disclosure adds no state to `App`: no preference, no vault write, nothing
  on the typing path.
- The compact bar is untouched.

**Non-Goals:**

- No version grouping, no breaking-change badges, no links out.
- No changes to `RowContextMenu`; the popover is not a menu and reuses none of
  its items, focus movement, or keyboard walk.

## Decisions

### D1: `CHANGELOG.md` is committed and generated from git by a script

`scripts/changelog.mjs` reads `git log` oldest-first, keeps subjects starting
`feat:` or `fix:`, strips the prefix, and writes `CHANGELOG.md` at the repo root:
a short header, then `## <YYYY-MM-DD>` date groups (newest first) with one
`- <subject>` bullet each. It keeps the newest 40 entries so the file — and the
bundle that carries it — stays small.

Rationale: the subjects already exist, so nothing has to be written twice; the
file is committed, so the build is a plain `?raw` import that works in a shallow
CI checkout; and the file is readable on GitHub, which is where a user goes when
they want more than the popover shows.

- Rejected: generating from git inside the build (a Vite virtual module). It
  needs `fetch-depth: 0` in the deploy workflow, a stub alias in `vitest.config`,
  and it makes the bundle depend on the build machine's git — three pieces of
  machinery to avoid one committed text file.
- Rejected: hand-maintained entries in a TypeScript module. It drifts the moment
  someone forgets, and a "what's new" list that is missing the newest change is
  worse than none.
- Rejected: per-entry version headings. Every commit bumps the version, so an
  entry's own version is older than the badge a user is looking at, and pairing
  an entry with the version that contains it means reading `package.json` at
  every commit.

### D2: One module parses the file; the badge renders a capped list

`src/changelog.ts` imports `CHANGELOG.md?raw` and exports
`recentChanges: Change[]` — `{ date, text }`, newest first — parsing the date
groups and their bullets, ignoring anything that does not match. The panel shows
the newest 20 entries; the file holds more so the cap can grow without
regenerating. Parsing runs once at module load, off every render path, so opening
the panel costs nothing beyond the render it causes.

### D3: The badge is a disclosure button, and the panel is a child of the bar

The `<span>` becomes a `<button type="button">` with the same text, colour, and
gaps as before, plus `aria-expanded` and `aria-controls`. The panel is an
absolutely positioned child of a `relative` wrapper around the button
(`bottom: calc(100% + 8px); right: 0`), so it needs no measurement, no clamp, and
no portal.

Focus stays on the button: it is a disclosure, not a dialog, so moving focus into
the panel would steal the user's place for a surface with nothing to operate. The
dismissals are the small set this shape needs — a second activation, a captured
`pointerdown` outside the panel, `Escape` while open, and window `blur` — bound
only while open. `Escape` is read on the button and on the document so it works
whether or not the badge kept focus.

### D4: The empty state renders no control

A build whose changelog parsed to nothing shows the badge as the plain text it is
today, so the bar never offers a control that opens an empty box. It cannot
happen in a real build (the file is generated and committed), which is why it is
a fallback rather than a state with its own copy.

### D5: The rule keeps operating the list, not the app

`AGENTS.md`'s version-bump rule gains one clause: regenerate the changelog in the
same commit, so the version a build shows and the changes it names agree.
`README.md` names the badge as the in-app changelog. `DESIGN.md` gains the
panel's recipe under the surfaces the app already documents (ivory fill, hairline
border, whisper shadow, 8px radius, 12px stone text), because rule 4 reserves the
whisper shadow for exactly this kind of floating surface.

## Risks / Trade-offs

- [The changelog lags a commit if the script is not run] → It self-heals on the
  next run, the rule names the step, and the popover's newest entry is still a
  true statement about the build. Nothing reads the file for anything else.
- [A subject is written for a developer, not a user] → Subjects are already
  imperative prose ("refuse a page name the folder cannot hold"); the popover
  shows them as written rather than pretending to write marketing copy.
- [The panel could cover the bar's crumb on a narrow window] → It is anchored to
  the trailing edge and above the bar, so it covers the editor's bottom-right
  corner, never the bar; its width is capped and its body scrolls.
- [`?raw` import inflates the bundle] → 40 short entries are a few kilobytes and
  ride in the entry chunk; the cap keeps them there.
- [A commit with no `feat:`/`fix:` prefix ships silently] → The script's filter is
  the rule from the proposal; `chore:` and `docs:` are not user-facing, and a
  missed `feat:` is fixed by amending the subject, not the popover.

## Migration Plan

None. Additive UI over an existing label; no stored state, no data, nothing to
roll back beyond reverting the change. The badge's text, place, and compact rule
are unchanged, so no layout migration is needed.

## Open Questions

None.
