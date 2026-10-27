import { blockStartLines } from '../lineAnchors'
import { findReferenceRanges } from '../vault/parse'

// The read-only Markdown renderer shared by the editor's rendered table cells
// and a presentation's slides (enable-presenting). It is a small walk, not a
// second grammar: `blockStartLines` decides where a block starts, and the
// inline rules mirror the app's reference scanner and table-cell renderer.
// Everything a page writes is escaped; the only tags in the output are the ones
// this module emits.

/** The class the pane's and the deck's stylesheets give a reference chip. */
export const REFERENCE_CLASS = 'ref'

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

/** A reference chip. It carries the target and kind, as the table cell's chip
 *  already does; a slide's chip is display-only. */
function chipHtml(text: string, target: string, kind: string): string {
  return `<span class="${REFERENCE_CLASS}" data-ref-target="${escapeAttr(target)}" data-ref-kind="${kind}">${escapeHtml(text)}</span>`
}

/** One inline run as HTML: code spans first (so a reference inside one stays
 *  literal), then images and links, then the emphasis family, and finally the
 *  app's reference chips. Every branch advances past the whole construct, so a
 *  construct is never re-read as a different one. */
export function renderInline(raw: string): string {
  const refs = new Map(findReferenceRanges(raw).map((ref) => [ref.from, ref]))
  let out = ''
  let at = 0
  while (at < raw.length) {
    const ref = refs.get(at)
    if (ref) {
      out += chipHtml(raw.slice(ref.from, ref.to), ref.target, ref.kind)
      at = ref.to
      continue
    }
    const rest = raw.slice(at)
    const code = /^(`+)([^`]*?)\1/.exec(rest)
    if (code) {
      out += `<code>${escapeHtml(code[2])}</code>`
      at += code[0].length
      continue
    }
    const image = /^!\[([^\]]*)\]\(\s*(?:<([^>]*)>|([^)\s]*))\s*(?:"[^"]*"|'[^']*')?\s*\)/.exec(
      rest,
    )
    if (image) {
      const url = image[2] ?? image[3] ?? ''
      if (url !== '') {
        out += `<img src="${escapeAttr(url)}" alt="${escapeAttr(image[1])}" loading="lazy">`
      }
      at += image[0].length
      continue
    }
    const autolink = /^<((?:https?|mailto):[^>\s]+)>/.exec(rest)
    if (autolink) {
      out += `<a href="${escapeAttr(autolink[1])}" target="_blank" rel="noopener noreferrer">${escapeHtml(autolink[1])}</a>`
      at += autolink[0].length
      continue
    }
    const link = /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(rest)
    if (link) {
      out += `<a href="${escapeAttr(link[2])}" data-href="${escapeAttr(link[2])}" target="_blank" rel="noopener noreferrer">${escapeHtml(link[1])}</a>`
      at += link[0].length
      continue
    }
    const strong = /^(\*\*|__)(.+?)\1/.exec(rest)
    if (strong) {
      out += `<strong>${escapeHtml(strong[2])}</strong>`
      at += strong[0].length
      continue
    }
    const emphasis = /^(\*|_)(.+?)\1/.exec(rest)
    if (emphasis) {
      out += `<em>${escapeHtml(emphasis[2])}</em>`
      at += emphasis[0].length
      continue
    }
    const strike = /^~~(.+?)~~/.exec(rest)
    if (strike) {
      out += `<del>${escapeHtml(strike[1])}</del>`
      at += strike[0].length
      continue
    }
    out += escapeHtml(raw[at])
    at += 1
  }
  return out
}

/** The block's node type name, as the presentation renderer reads it. */
export function blockType(body: string): string {
  const first = body.split('\n')[0].trim()
  if (/^(`{3,}|~{3,})/.test(first)) return 'code_block'
  if (/^#{1,6}\s/.test(first)) return 'heading'
  if (/^[-*+]\s/.test(first)) return 'bullet_list'
  if (/^\d+[.)]\s/.test(first)) return 'ordered_list'
  if (/^>/.test(first)) return 'blockquote'
  if (/^\|/.test(first)) return 'table'
  if (/^(---|\*\*\*|___)\s*$/.test(first)) return 'hr'
  return 'paragraph'
}

/** One top-level block's static HTML. */
export function renderBlock(body: string): string {
  switch (blockType(body)) {
    case 'code_block':
      return renderCode(body)
    case 'heading':
      return renderHeading(body)
    case 'bullet_list':
    case 'ordered_list':
      return renderList(body)
    case 'blockquote':
      return renderBlockquote(body)
    case 'table':
      return renderTable(body)
    case 'hr':
      return '<hr>'
    default:
      return `<p>${renderParagraph(body)}</p>`
  }
}

/** A block's text as a paragraph, with a soft line break rendered as a space
 *  and a hard break (two trailing spaces or a backslash) as `<br>`. */
function renderParagraph(body: string): string {
  const lines = body.split('\n')
  let out = ''
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) out += /(?:\\| {2,})$/.test(lines[i - 1]) ? '<br>' : ' '
    out += renderInline(lines[i].replace(/(?:\\| {2,})$/, ''))
  }
  return out
}

function renderHeading(body: string): string {
  const match = /^(#{1,6})\s+(.*)$/.exec(body.trim().split('\n')[0])
  if (!match) return `<p>${renderInline(body)}</p>`
  const depth = match[1].length
  return `<h${depth}>${renderInline(match[2].trim())}</h${depth}>`
}

function renderCode(body: string): string {
  const lines = body.split('\n')
  const first = lines[0].trim()
  const marker = /^(`{3,}|~{3,})(\S*)/.exec(first)
  const language = marker?.[2] ?? ''
  const fence = marker?.[1] ?? ''
  const closes = fence !== '' && lines[lines.length - 1].trim().startsWith(fence)
  const code = lines.slice(1, closes ? -1 : undefined).join('\n')
  return `<pre><code${language ? ` class="language-${escapeAttr(language)}"` : ''}>${escapeHtml(code)}</code></pre>`
}

/** A block's text split into blocks by the app's own boundary rule, rendered. */
function renderBlocks(text: string): string {
  if (text.trim() === '') return ''
  const lines = text.split('\n')
  const anchors = blockStartLines(text)
  return anchors
    .map((start, i) => {
      const end = (anchors[i + 1] ?? lines.length + 1) - 1
      return renderBlock(
        lines
          .slice(start - 1, end)
          .join('\n')
          .trimEnd(),
      )
    })
    .join('')
}

function renderBlockquote(body: string): string {
  const inner = body
    .split('\n')
    .map((line) => line.replace(/^\s*>\s?/, ''))
    .join('\n')
  return `<blockquote>${renderBlocks(inner)}</blockquote>`
}

type List = { ordered: boolean; items: { text: string; children: List[] }[] }

/** A list, with nested lists by indentation. A continuation line belongs to the
 *  item above it; a marker at a deeper indent opens a child list. */
function renderList(body: string): string {
  const root: List = { ordered: false, items: [] }
  const stack: { indent: number; list: List }[] = []
  let first = true
  for (const line of body.split('\n')) {
    const match = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)
    if (!match) {
      const current = stack.length > 0 ? stack[stack.length - 1].list : root
      const last = current.items[current.items.length - 1]
      if (last && line.trim() !== '') last.text += ` ${line.trim()}`
      continue
    }
    const indent = match[1].replace(/\t/g, '    ').length
    const ordered = /^\d/.test(match[2])
    while (stack.length > 0 && indent < stack[stack.length - 1].indent) stack.pop()
    const parent = stack[stack.length - 1]
    if (first) {
      root.ordered = ordered
      first = false
    }
    if (!parent) {
      root.items.push({ text: match[3], children: [] })
      stack.push({ indent, list: root })
      continue
    }
    if (indent > parent.indent) {
      const nested: List = { ordered, items: [] }
      const last = parent.list.items[parent.list.items.length - 1]
      if (last) last.children.push(nested)
      nested.items.push({ text: match[3], children: [] })
      stack.push({ indent, list: nested })
      continue
    }
    parent.list.items.push({ text: match[3], children: [] })
  }
  return renderListHtml(root)
}

function renderListHtml(list: List): string {
  const tag = list.ordered ? 'ol' : 'ul'
  const items = list.items
    .map(
      (item) => `<li>${renderInline(item.text)}${item.children.map(renderListHtml).join('')}</li>`,
    )
    .join('')
  return `<${tag}>${items}</${tag}>`
}

/** A GFM table: the first row is the header, a delimiter row carries the
 *  alignment, and the rest are body rows. */
function renderTable(body: string): string {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))
  if (lines.length === 0) return ''
  const cells = (line: string): string[] =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
  const header = cells(lines[0])
  const delimiter = lines[1] ? cells(lines[1]) : []
  const hasDelimiter = delimiter.length > 0 && delimiter.every((cell) => /^:?-{1,}:?$/.test(cell))
  const align = delimiter.map((cell) =>
    /^:-+:$/.test(cell)
      ? 'center'
      : /^:-+$/.test(cell)
        ? 'left'
        : /^-+:$/.test(cell)
          ? 'right'
          : null,
  )
  const bodyRows = lines.slice(hasDelimiter ? 2 : 1).map(cells)
  const style = (i: number): string => (align[i] ? ` style="text-align:${align[i]}"` : '')
  const th = header.map((cell, i) => `<th${style(i)}>${renderInline(cell)}</th>`).join('')
  const rows = bodyRows
    .map(
      (row) =>
        `<tr>${row.map((cell, i) => `<td${style(i)}>${renderInline(cell)}</td>`).join('')}</tr>`,
    )
    .join('')
  return `<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`
}
