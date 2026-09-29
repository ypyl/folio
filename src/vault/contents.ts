// Page contents (add-page-contents): the headings of a page's saved Markdown,
// as the row data for the meta panel's Contents section. Pure extraction, no
// IO. It is built on the shared block-start rule (src/lineAnchors.ts) so each
// row's `block` is exactly the top-level block index the editor's
// `highlightBlock` and the search marking already use — the same index, so a
// Contents row locates the same block search would. Heading detection is
// limited to block starts, so a `#` inside a fenced code block or on a wrapped
// continuation line is never a heading.

import { blockStartLines } from '../lineAnchors'

/** One Contents row: a heading's level, its plain text, and the index of the
 *  top-level block it begins (the index `highlightBlock` expects). */
export type ContentEntry = { level: number; text: string; block: number }

// An ATX heading: one to six `#` followed by whitespace or end of line (so
// `#tag` and `#######` are not headings), an optional trailing run of `#`.
const ATX = /^(#{1,6})(?=\s|$)\s*(.*?)\s*#*\s*$/

/** Reduce a heading's inline Markdown to the text a reader sees. */
function plainText(raw: string): string {
  return raw
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // image -> its alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // link -> its label
    .replace(/`([^`]*)`/g, '$1') // inline code -> its content
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .trim()
}

/**
 * The headings of `markdown`, in document order. Each row's `block` is the
 * index of the top-level block the heading begins, matching the editor.
 */
export function deriveContents(markdown: string): ContentEntry[] {
  const lines = markdown.split('\n')
  const entries: ContentEntry[] = []
  blockStartLines(markdown).forEach((lineNumber, block) => {
    const match = ATX.exec(lines[lineNumber - 1] ?? '')
    if (!match) return
    entries.push({ level: match[1].length, text: plainText(match[2]), block })
  })
  return entries
}
