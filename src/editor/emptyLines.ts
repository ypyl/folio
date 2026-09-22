// Normalizes the blank line an empty list item needs before a child block, on
// both sides of the editor's Markdown boundary (change
// fix-empty-list-item-line). Milkdown writes an empty paragraph as `<br />`, and
// a list item's blocks are written tight, so an item of [empty paragraph, code
// block] serializes as `* <br />` immediately followed by the indented fence.
// CommonMark reads a line beginning with `<br />` as the start of an HTML block,
// which runs until a blank line and swallows the fence; on re-parse the item
// becomes one inline `html` atom and the code block degrades to literal text. A
// blank line ends the HTML block, so the item round-trips.

const FENCE = /^(\s*)(`{3,}|~{3,})/
const EMPTY_ITEM = /^(\s*)(?:[-*+]|\d+[.)])\s+<br\s*\/?>\s*$/i

/**
 * Insert a blank line after a list item whose whole content is `<br />` when the
 * next line is more indented — a child block of that item. A sibling item, a
 * blank line, fenced code content, and every other shape are left untouched, so
 * the function is idempotent and safe to run on both save and open.
 */
export function separateEmptyListLines(markdown: string): string {
  const lines = markdown.split('\n')
  const out: string[] = []
  let fence: string | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = line.match(FENCE)

    if (fence !== null) {
      if (fenceMatch && fenceMatch[2][0] === fence[0] && fenceMatch[2].length >= fence.length) {
        fence = null
      }
      out.push(line)
      continue
    }
    if (fenceMatch) {
      fence = fenceMatch[2]
      out.push(line)
      continue
    }

    out.push(line)
    const emptyItem = line.match(EMPTY_ITEM)
    if (!emptyItem) continue
    const next = lines[i + 1]
    if (next === undefined || next.trim() === '') continue
    const nextIndent = next.length - next.trimStart().length
    if (nextIndent > emptyItem[1].length) out.push('')
  }

  return out.join('\n')
}
