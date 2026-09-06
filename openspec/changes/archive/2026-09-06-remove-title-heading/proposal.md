## Why

The main panel shows the page title as a rendered heading above the editor (`<h1>` with the filename stem). With a real WYSIWYG editor that shows the file's own content, the heading is redundant chrome — and when the file already starts with `# Title`, the title appears twice (once in the pane chrome, once inside the content). The pane should show only the file content.

## What Changes

- Remove the title `<h1>` from the editor pane; the pane renders the Milkdown editor surface only (the file content itself, as the user writes it).
- The page title remains available in the sidebar row; nothing else renders it in the pane.
- Remove the now-unused `.title` stylesheet block.
- Update component and app tests: assertions that the pane shows the title heading are replaced with content-seeding assertions (editor seeded with the page's Markdown, no heading in the pane).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `static-navigation`: the "Open page renders title and content" requirement changes — the pane's surface is the content only; the title is no longer rendered as a heading in the pane.