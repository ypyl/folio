// Markdown-likeness sniff for paste (design D1, paste-as-markdown): decides
// whether pasted plain text resembles a Markdown document. Block-level,
// line-start signals only — inline markers (`**`, `*`, backticks, links)
// never trigger interpretation, so casual copies stay literal.

// A fence opener at line start is unambiguous: `code` fences mark real
// Markdown. Unambiguous enough to parse on its own.
const FENCE = /^\s{0,3}(```|~~~)/

// Line-start block markers, honoring Markdown's 3-space indent rule so
// indented code (4-space `#` comments or `-` lists in code) never counts.
const SIGNALS: RegExp[] = [
  /^\s{0,3}#{1,6}\s+\S/, // ATX heading
  /^\s{0,3}>/, // blockquote
  /^\s{0,3}[-*+]\s+\S/, // unordered list item
  /^\s{0,3}\d+[.)]\s+\S/, // ordered list item
  /^\s{0,3}\|/, // table row
  /^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/, // thematic break
]

/** True when pasted text should be interpreted as Markdown rather than
 *  inserted literally. */
export function looksLikeMarkdown(text: string): boolean {
  let signals = 0
  let nonBlank = 0
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) continue // blank lines never count
    nonBlank++
    if (FENCE.test(rawLine)) return true
    if (SIGNALS.some((re) => re.test(rawLine))) signals++
  }
  // Corroboration: at least two signal lines, together forming half or more
  // of the non-blank lines. A lone `# Title` needs a second signal, which
  // protects single `# comment` lines pasted from code.
  return signals >= 2 && signals * 2 >= nonBlank
}