// CodeMirror setup for the component-backed code block (design D, code-block-
// component change). The block's editing surface is a CodeMirror 6 editor;
// these are its extensions and the Folio-token theme. Markdown stays the
// canonical on-disk form — this module only changes how the block is edited
// and rendered in the pane (ADR-0001, ADR-0008/0011).

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { EditorView, basicSetup } from 'codemirror'
import { tags } from '@lezer/highlight'

// The language catalog fed to the component's language picker. Full
// @codemirror/language-data list (as the component docs show); each language
// is lazy — only the languages actually used fetch their grammar chunk.
export const codeBlockLanguages = languages

// Folio design-token highlighting (DESIGN.md — Code): keyword --brand,
// comment --stone, string --olive, number --dark-warm, function/class
// --near-black. Hex values mirror the tokens in DESIGN.md so the two cannot
// drift; blocks without a language get no HighlightStyle and stay monochrome.
const folioHighlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.operator, tags.bool, tags.null], color: '#1B365D' }, // --brand
  { tag: [tags.comment, tags.meta], color: '#6b6a64' }, // --stone
  { tag: [tags.string, tags.regexp, tags.special(tags.string)], color: '#504e49' }, // --olive
  { tag: [tags.number, tags.integer, tags.float], color: '#3d3d3a' }, // --dark-warm
  {
    tag: [
      tags.function(tags.variableName),
      tags.className,
      tags.typeName,
      tags.definition(tags.variableName),
    ],
    color: '#141413', // --near-black
  },
])

// Chrome for the CM surface (line numbers etc.) stays quiet — the block's
// visual container (ivory fill, language label) comes from the pane's
// token-based stylesheet (EditorPane.module.css), not from CM.
const folioTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', fontSize: '13px' },
  '.cm-content': { caretColor: '#141413', fontFamily: 'monospace' }, // --near-black
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#6b6a64' }, // --stone
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(27, 54, 93, 0.12)', // --brand at low opacity
  },
  '&.cm-focused': { outline: 'none' },
})

// Everything the component's codeBlockConfig extensions option receives.
// basicSetup brings the requested conveniences (line numbers, completion,
// folding, search/replace) and the default keymap; syntaxHighlighting applies
// the Folio tokens.
export const codeBlockExtensions: import('@codemirror/state').Extension[] = [
  basicSetup,
  syntaxHighlighting(folioHighlight),
  folioTheme,
]
