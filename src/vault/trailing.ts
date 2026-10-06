// A page's terminal empty line (add-trailing-empty-line). Folio stores pages so
// they always end with exactly one empty line: the editor presents one when a
// page opens, and every page or journal the app writes keeps one. This is a
// rule about the on-disk shape of a page, so it lives in the vault layer
// (ADR-0009, Markdown is canonical); the editor layer never imports it
// (ADR-0010), because App normalizes the string it hands the pane.

/** Normalize `text` so it ends with exactly one empty line: strip its trailing
 *  newlines, then append a blank line. A text with nothing but newlines becomes
 *  a single empty line. Whitespace above the terminal line is untouched. */
export function withTrailingBlankLine(text: string): string {
  const body = text.replace(/\n+$/, '')
  return body === '' ? '\n' : `${body}\n\n`
}
