# Decision: Use Milkdown as the Markdown Editor Component

## Context

The goal is to build a lightweight, local-first Logseq alternative where:

* Markdown files remain the source of truth.
* The application provides a better UI for navigation, editing, and linking.
* No database or proprietary document format should replace Markdown.
* The application should stay simple and avoid rebuilding Logseq.

The main challenge is providing a pleasant editing experience without implementing a complete Markdown editor from scratch.

## Decision

Use **Milkdown** as the core Markdown editing component.

Milkdown provides a WYSIWYG Markdown editing experience while keeping Markdown as the underlying document format.

Architecture:

```
Markdown file
      │
      ▼
 Milkdown editor
      │
      ▼
 User edits visually
      │
      ▼
 Markdown serialization
      │
      ▼
 Save back to .md file
```

The editor handles:

* Text editing
* Markdown rendering
* Formatting
* Lists
* Links
* Code blocks
* Tables
* Extensions/plugins

The application remains responsible for knowledge-management features.

## Why Milkdown Instead of Building a Custom Editor

Building a Logseq-like editor from scratch would require solving:

* cursor behavior
* selection handling
* undo/redo
* keyboard shortcuts
* Markdown parsing
* formatting commands
* clipboard handling
* rich text rendering
* serialization

These are complex problems unrelated to the main value of the application.

Milkdown provides the editing foundation while allowing the project to focus on:

* local filesystem handling
* Markdown vault management
* wikilinks
* backlinks
* journals
* search

## Why Not BlockNote

BlockNote is a strong alternative, but it is designed around a block-based document model similar to Notion.

Its architecture is closer to:

```
Document
   │
   ▼
Block model
   │
   ▼
Editor UI
```

This is excellent for building a Notion-style application.

However, this project has a different philosophy:

```
Markdown file
      │
      ▼
Editor UI
      │
      ▼
Markdown file
```

The Markdown file must remain the canonical representation.

Using a block-based editor risks introducing:

* internal document models
* conversion complexity
* hidden metadata
* synchronization problems

Milkdown fits better because Markdown remains the primary data structure.

## Integration Architecture

The application should keep the editor separate from the vault logic.

```
                 React PWA

                     │

              Milkdown Editor

                     │

             Markdown serialization

                     │

              Vault Service

                     │
        ┌────────────┼────────────┐
        │            │            │
     Wikilinks   Backlinks    Journals
        │            │            │
        └────────────┼────────────┘

                     │

          File System Access API

                     │

              Markdown files
```

## Custom Features

The application can extend Milkdown with custom nodes.

Example:

Markdown:

```md
I am learning about [[Machine Learning]].
```

Rendered editor:

```
I am learning about Machine Learning.
                         ↑
                    clickable reference
```

When clicked:

```
[[Machine Learning]]
          │
          ▼
Machine Learning.md
```

The underlying file remains normal Markdown.

## Implementation Principle

Milkdown owns:

* Editing experience
* Markdown parsing
* Markdown serialization
* Formatting

The application owns:

* File storage
* Vault indexing
* Page resolution
* Backlinks
* Tags
* Journals
* Search

This separation keeps the project small and maintainable.

## Final Decision

Use Milkdown as the editor layer.

Do not build a custom editor.

Do not use a block-based document model.

Keep Markdown as the source of truth and build only the knowledge-management layer around it.