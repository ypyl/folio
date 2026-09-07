// The single line-numbering rule shared by the editor gutter and search
// (line-numbers change). A page's Markdown is line-based (ADR-0001), so a
// physical line is a real address; this module decides which lines are
// block starts. The rule: a line starts a block iff it is the first line or
// follows a blank line; fenced code interiors are skipped (their lines are
// code, not blocks). Blank lines are counted in the numbering but are never
// anchors. One implementation, two consumers — the editor derives per-block
// lines from its canonical text, search derives a match's anchor from the
// file text; they agree by construction on canonicalized pages.

/**
 * 1-based line numbers of every block start in `text`, in order.
 *
 * - The first line is always an anchor.
 * - A non-blank line following a blank line is an anchor.
 * - A non-blank line following a non-blank, non-anchor line is a
 *   continuation (a wrapped paragraph or hard-break line) — not an anchor.
 * - Lines inside a fenced code block (and the closing fence) are never
 *   anchors; the opening fence is the block's anchor.
 * - Blank lines count toward later numbering but yield no anchor, so the
 *   result can read 1, 3, 5.
 */
export function blockStartLines(text: string): number[] {
  const anchors: number[] = []
  const lines = text.split('\n')
  let inFence = false
  let prevBlank = true // line 1 is an anchor regardless of context

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (inFence) {
      // Code interior: never an anchor, and never resets prevBlank (a blank
      // inside a fence is code content, not a paragraph separator).
      if (/^```$/.test(trimmed)) inFence = false
      continue
    }
    if (/^```/.test(trimmed)) {
      // Opening fence: the fence line IS the code block's anchor.
      if (i === 0 || prevBlank) anchors.push(i + 1)
      inFence = true
      prevBlank = false
      continue
    }
    if (trimmed === '') {
      prevBlank = true
      continue
    }
    if (i === 0 || prevBlank) anchors.push(i + 1)
    prevBlank = false
  }

  return anchors
}