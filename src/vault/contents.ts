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

/** A Contents row plus the headings nested under it (add-contents-tree). */
export type ContentNode = ContentEntry & { children: ContentNode[] }

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

/**
 * The headings of `entries` as a tree (add-contents-tree): a heading is a
 * child of the nearest preceding heading with a lower level, and the run of
 * deeper headings before the next heading at its level or lower is its
 * subtree. Roots are the headings with no shallower heading before them, so
 * levels need not start at one and a skipped level (an `#` then a `###`)
 * still nests. `entries` are taken in document order.
 */
export function buildContentTree(entries: ContentEntry[]): ContentNode[] {
  const roots: ContentNode[] = []
  // The open ancestor chain, shallowest first; the last node is the current
  // parent of whatever heading comes next.
  const stack: ContentNode[] = []
  for (const entry of entries) {
    const node: ContentNode = { ...entry, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    stack.push(node)
  }
  return roots
}
