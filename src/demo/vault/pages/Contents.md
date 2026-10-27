# Contents

The right panel's Contents section mirrors the headings on this page. It is the
same tree you would draw on paper, and it is built from the Markdown, not stored
anywhere.

> Demo guide. #Welcome has the table of contents.

## The tree follows the headings

### A deeper heading

Contents indents each level below the top, so this heading sits under its parent.
The disclosure control in the panel collapses the subtree without changing the
page; clicking a heading's label scrolls the editor to it.

### A sibling

Two headings of the same level are siblings, not a parent and child.

## Only headings count

A list item, a paragraph, a table row, and a code block are content, not
structure. None of them gets a Contents row. Headings inside a fenced code block
are not headings either:

```md
# not a heading for Contents
```

## Duplicate headings

### Same name

### Same name

Two headings with the same text are two rows. The panel does not merge them.
