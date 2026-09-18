# Architecture Decision Records

All significant architecture decisions for Folio are recorded here, following the [MADR](https://adr.github.io/madr/) style:

```text
Status: Accepted | Proposed | Superseded
Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```

Each ADR is a short, self-contained record: why the decision matters, what was decided, and what it costs us. Status changes are reflected by editing the record, not rewriting history. If a later decision changes an earlier one, the superseding ADR references it.

## Decided

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-markdown-folder-is-the-database.md) | The Markdown folder is the database | Accepted |
| [0002](0002-chromium-first-pwa-file-system-access.md) | Chromium-first PWA using the File System Access API | Accepted |
| [0003](0003-vault-storage-abstraction.md) | Abstract filesystem access behind a `VaultStorage` interface | Accepted |
| [0004](0004-in-memory-vault-index.md) | In-memory vault index, rebuilt on open, updated incrementally | Accepted |
| [0005](0005-keep-ui-small-three-pane-layout.md) | Keep the UI small: three-pane layout, no graph visualization | Accepted |
| [0006](0006-scope-guardrails-not-logseq.md) | Scope guardrails: do not rebuild Logseq | Accepted |
| [0007](0007-technology-stack.md) | Technology stack: Vite, React, TypeScript, no backend | Accepted |
| [0008](0008-use-milkdown-as-markdown-editor.md) | Use Milkdown as the Markdown editor component | Accepted |
| [0009](0009-reject-block-based-document-model.md) | Keep Markdown canonical — reject block-based editing | Accepted |
| [0010](0010-editor-vault-separation.md) | Keep the editor separate from the knowledge-management layer | Accepted |
| [0011](0011-kami-design-language.md) | Adopt the Kami design language for Folio's visual identity | Accepted |
| [0012](0012-unified-page-references.md) | Unified page references: tags and wikilinks are the same thing | Accepted |
| [0013](0013-vault-storage-path-and-io-contract.md) | VaultStorage path and I/O contract | Accepted |
| [0014](0014-adopt-milkdown-code-block-component.md) | Adopt the Milkdown component code block (CodeMirror) | Accepted |
| [0015](0015-in-vault-app-meta.md) | The `.folio/` directory is app-owned state inside the vault | Accepted |
| [0016](0016-apply-commands-by-key-chord.md) | Apply editor commands by replaying their key chord | Accepted |
| [0017](0017-adopt-gfm-table-slice-and-table-block.md) | Adopt the GFM table slice and the component table block | Accepted |
| [0018](0018-image-node-view.md) | Folio owns the image node's DOM through a node view | Accepted |
| [0019](0019-date-names-are-journal-days.md) | Date-shaped names are journal days | Accepted |
| [0020](0020-list-markers-stay-put.md) | List markers stay where the browser places them | Accepted |
| [0021](0021-vault-files-open-as-derived-copies.md) | A vault file opens as a derived copy, never in place | Accepted |
| [0022](0022-assets-are-vault-files-not-pages.md) | Assets are vault files, not pages | Accepted |
| [0023](0023-drops-land-at-the-drop-point.md) | A drop lands at the drop point, and a drag carries a fact | Accepted |

## Adding a new ADR

1. Copy the next free number (`0008-...`).
2. Fill in Status, Date, Context, Decision, Consequences.
3. Add a row to the table above.