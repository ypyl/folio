# Design

## D1. What is hidden, and when

The syntax tree gives a link's marks as `LinkMark` children: `[` first, then the content, then `]`, `(`, the destination, and `)`. So the construct hides in two ranges:

- the opening mark, `[`
- everything from the closing mark on: `]`, the destination, and any title, which is the node's tail

That second range is found by name rather than by position: the first `LinkMark` after the opening one whose text begins with `]`. Taking "the second child onward" instead would swallow an image label, because in `[![alt](img.png)](dest)` the second child is the image, not the closing bracket.

An `Autolink` has the same shape without the bracket pair: `<`, the URL, `>`. It hides its first and last mark, so it reads as a URL in brand ink.

The reveal rule is the one the inline runs already use: the selection touching the node's range shows the whole construct. A plain press on the label places the caret inside the link, so the source comes back on that press, and moving away renders the link again.

## D2. Only a link with a destination

Brackets alone parse as a CommonMark shortcut reference link: `[[Page]]` is a `Link` node spanning `[Page]`, and Folio's own `#[[reading list]]` is a `Link` spanning `[reading list]`. Hiding the marks of those would turn the first into a link, which ADR-0012 says it is not ("unsupported conventions render as text"), and would strip the brackets from the second, which is the reference chip's own token. The first attempt at this change did exactly that, and the existing reference test caught it.

So the rule is that a link is hidden only when it carries a destination: the node has a `URL` child. That admits `[text](url)`, `[text](url "title")`, `[![alt](img)](dest)`, and `<https://example.com>`, and excludes `[[Page]]`, `#[[reading list]]`, `[ref]`, and `[a][b]` — none of which Folio resolves as a link anyway, because it resolves no link-reference definitions.

Note that `#![[Board name]]` parses as an `Image` whose text is `![[Board name]]`, so the image branch sees it first and declines it (it is not the `![alt](url)` shape), and the nested `Link` has no destination. A board reference therefore stays literal text under its chip.

## D3. The guards

- A link with no link text (`[](url)`) shows its source. Hiding its marks would leave nothing visible, and an invisible span can be neither clicked nor found.
- Each hidden range is checked to sit within one line. A link's tail cannot span lines in valid CommonMark, but the pass refuses rather than trusting that: a view plugin may not replace a line break, which is why the table field exists at all.
- A link inside a code span or a fenced block is not a link node, so the literal-text rule that already covers references and emphasis covers this too.

## D4. No new styling

The link's text already carries `tags.link` from `@codemirror/lang-markdown`, which the theme maps to `--brand`. So hiding the marks leaves the label in brand ink with no underline, which is DESIGN.md's one link behavior. The destination keeps `tags.url` and the marks keep `tags.processingInstruction`; both are only visible while the construct is revealed.

Underlining is deliberately not part of this change. DESIGN.md's Links rule states one behavior app-wide, "brand color, no underline, hover lightens", and warns that two exceptions drift into five. If underlined links are wanted, that is a change to DESIGN.md first, and then one line here.

## D5. Interaction with a revealed table

A GFM table shows its whole source while the caret is on it, and the inline pass is independent of that: a link inside a revealed table row renders as its text on the same per-span rule, and shows its source when the caret is inside the link. That is consistent with a bold run inside a revealed table row, which renders as bold for the same reason. It is also the case the samples showed: the reported pair was in a table row.

## D6. What does not change

The click path is untouched. `linkAt` resolves the destination from the syntax tree under the pointer, and hiding a mark does not remove the node, so Ctrl+Click still opens the file or URL the user cannot see. The `External URLs open on Ctrl+Click` and `Vault asset links open the stored file` requirements are unchanged, and this change adds no behavior to them.
