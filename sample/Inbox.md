# Inbox

Loose notes, captured fast. Triaged later.

* Idea: make the three-pane layout resizable (see #Welcome for scope notes)
* Question: should #\[\[Reading Log]] entries get a rating field?
* Bookmark: a good article on local-first software
* \#Inbox

## Quick capture

Drafts auto-save here ~1 second after you stop typing. Check the status line in
the bottom-left corner of the editor pane: "Unsaved changes", "Saving…", or
"Save failed".

```js
/** Case-insensitive exact occurrences of a term in raw text. Used for
 *  highlighting because Fuse's fuzzy ranges are per-character and render as
 *  scattered 1-2 char marks; exact spans keep snippets clean. */
export function exactRanges(text: string, term: string): SearchRange[] {
  const hay = text.toLowerCase()
  const needle = term.toLowerCase()
  const ranges: SearchRange[] = []
  let from = 0
  let i: number
  while ((i = hay.indexOf(needle, from)) !== -1) {
    ranges.push([i, i + needle.length])
    from = i + needle.length
  }
  return ranges
}

```
