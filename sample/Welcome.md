# Welcome to Folio

This is Folio's sample vault. Edit this page or open others to try the editor,
auto-save, and backlinks.

## How references work

Folio's page references are `#word` or `#[[Page]]`. A reference shows as a badge
in the page: click it to open the target, or put the caret inside it and press
Ctrl/Cmd+Enter. Reference syntax written in a code span stays literal and gets
no badge.

* \#Inbox — a word reference to another page
* \#\[\[Reading Log]] — a bracketed reference (handles spaces and hyphens)
* \#Welcome — case-insensitive, resolves to this page (self-references are
  excluded from backlinks)
* \#missing-topic — a reference to a page that doesn't exist yet; opening it
  starts a blank page

  <br />
* `[[Old Style]]` — double-bracket wikilinks are **not** a reference form; this
  renders as literal text with no badge (ADR-0012)

## Pages in this vault

* \#Inbox — where loose thoughts land
* \#\[\[Reading Log]] — what I'm reading
* `Standalone` — a page nothing links to (orphan; its backlinks list stays empty)

## A tiny bit of prose

Keep it small. The folder is the database; the app is just a UI and an index
over it.

## Code blocks

A fenced block opens a code editing surface with a language picker and syntax
highlighting. The language stays in the opening fence:

```js
function greet(name) {
  return `Hello, ${name}!`
}

greet('Folio')
```

A fence without a language stays monochrome:

```
plain text, no highlighting, no language label
```
