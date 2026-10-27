# Editing and tasks

Pages are plain Markdown. The editor shows the text; images, tables, references,
and task checkboxes render inline while the caret is away, and the source returns
when you put the caret in it.

> Demo guide. #Welcome has the table of contents.

## Auto-save

Type, then wait about a second. The status bar shows **Unsaved changes**,
**Saving…**, and then the vault's name. A page that has never been saved says it
is new. Closing the tab flushes the last edit.

## Tasks

- [x] Read the welcome page
- [ ] Change this task's text
- [ ] Add a task of your own

Ticking a box is an ordinary edit; it saves with the page. A reminder written into
a journal day uses the same checkbox.

## Tables

| Element   | Markdown                                            |
| --------- | --------------------------------------------------- |
| Heading   | `# Heading`                                         |
| Reference | a hash and a name, or double brackets around a name |
| Board     | a hash, a bang, and the board's name                |
| Task      | `- [ ] item`                                        |

## Code

A fenced block gets syntax highlighting and a language picker, and the language
stays in the opening fence:

```js
function greet(name) {
  return `Hello, ${name}!`
}
```

## Lists

- A list item can hold a page reference.
  - A nested item works too.
  - Indent with Tab, outdent with Shift+Tab.

1. Ordered lists work.
2. So do blockquotes and rules.
