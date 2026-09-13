## 1. Decorate bare URLs

- [x] 1.1 In `src/editor/inlineDecorations.ts`, add the bare-URL match to the existing walk, pushing a `url` decoration for `http(s)://` and `www.` runs with trailing sentence punctuation trimmed, skipping text inside inline code, fenced code, and link marks (design D1); verify every existing decoration test still passes unchanged.
- [x] 1.2 Add the decoration's rule to `src/components/EditorPane.module.css` in the app's link style — brand ink, no underline, no padding or font change (design D4); verify the rule adds no metric change: the text's box and the gutter numbers are the same before and after.
- [x] 1.3 Extend the module's tests: `https://x/y`, `http://x`, and `www.x.y` decorated; a trailing `.`, `,`, or `)` left out; an intra-sentence URL decorated without the surrounding words; URLs in inline code, fenced code, and inside a markdown link's text not decorated; and the decoration surviving an edit in another block.

## 2. Open on Ctrl+Click

- [x] 2.1 In the same module's plugin, add the open branch as a `handleDOMEvents.click` handler (design D2, D3): a modifier click on a bare URL or on a link opens it with `window.open(url, '_blank', 'noopener,noreferrer')`; a target that is not an external URL stops the default and reports the click unhandled, so the editor still places the caret; a modifier-less click is left alone. Verify with tests that drive the click hook: modifier + URL span opens once, modifier + external anchor opens once, modifier + vault-relative anchor opens nothing but stops the default, plain click opens nothing and is untouched.
- [x] 2.2 Verify no double open, in the browser as well as in the tests: the click event carries `defaultPrevented: true` for an anchor, which is what stops the browser's own Ctrl+Click activation. The first browser check of this task showed two tabs for a markdown link while the branch lived in the plugin's mousedown-time `handleClick`, and the design records the move.

## 3. Gates

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 3.2 Run `npm test` and `npm run build`; verify both pass.

## 4. Browser verification

- [x] 4.1 With a real vault and a page holding a bare URL, a markdown link, and a vault-relative link: verify the bare URL is shown in link ink with the file unchanged, that Ctrl+Click on it and on the markdown link each open exactly one tab (record `window.open` calls), and that a plain click opens nothing and places the caret.
- [x] 4.2 Verify Ctrl+Click on the vault-relative link opens no tab and that the app has not navigated, and that the page's saved Markdown is byte-identical to what was typed after all of the above.
