## Context

`EditorPane` renders, above the editor mount, `<h1 className={styles.title}>{page.title}</h1>` (the filename stem from the index, ADR-0013). The Milkdown editor below it already renders the file's own content — files that start with `# Title` show the title twice. The pane has a `.document` wrapper (max-width + padding) that should stay; only the `.title` block and the heading go away.

## Goals / Non-Goals

**Goals:**
- The pane shows one surface: the WYSIWYG file content.
- Remove the dead `.title` CSS and all test assertions that expected the heading.

**Non-Goals:**
- No change to navigation, drafts, save flow, or the sidebar. The title is not moved anywhere else — it simply stops being rendered by the pane.
- No auto-generation of `# Title` inside the file content (files that lack a heading start with their body; that's the user's file).

## Decisions

**D1 — Delete the heading element, not hide it.** Remove the `<h1>` from the render; a `display:none` style would leave dead markup and confuse a11y (an H1 with no content role). Scope: one element, one CSS block, test updates.

**D2 — Tests assert the absence of the heading and the presence of seeded content.** In `EditorPane.test.tsx` the "renders the title heading" test becomes "renders the editor with the file content and no title heading". In `App.test.tsx`, the six `heading level 1` assertions (open page, journal entry, sidebar-switch open, and the vanish case) switch to: editor seeded with the page's Markdown + no title heading in the pane. The fake-editor harness (design D1 of milkdown-editor) already exposes `setContents` for seeding assertions.

## Risks / Trade-offs

- [Users may miss orienting chrome when a file starts with a non-heading paragraph] → The file's own content is the orientation; the sidebar marks the active page; files in this domain conventionally start with an H1 (the sample vault's do).