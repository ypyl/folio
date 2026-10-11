#!/usr/bin/env node
// De-outline a Logseq-imported Folio vault.
//
// Logseq stores every block as a bullet, so an imported page reads as one giant
// nested list. This turns that bullet tree back into a document: parents with
// children become headings, leaf runs that look like lists stay lists, and the
// rest become paragraphs. References (#tag, #[[Page]]) and code fences are
// preserved verbatim.
//
//   node scripts/deoutline-vault.mjs <vault> [--apply] [--all] [--only <substr>] [--backup <dir>]
//
// Dry-run by default: nothing is written without --apply.

import fs from 'node:fs';
import path from 'node:path';

const USAGE =
  'Usage: node scripts/deoutline-vault.mjs <vault> [--apply] [--all] [--only <substr>] [--backup <dir>]';
const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const forceAll = argv.includes('--all');
const only = valueAfter('--only');
const backupDir = valueAfter('--backup');
function valueAfter(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
}
const consumed = new Set();
for (const flag of ['--only', '--backup']) {
  const i = argv.indexOf(flag);
  if (i >= 0) consumed.add(i + 1);
}
const positional = argv.filter((a, i) => !a.startsWith('--') && !consumed.has(i));
if (positional.length !== 1) {
  console.error(USAGE);
  process.exit(1);
}
const VAULT = path.resolve(positional[0]);
// Only transform files that are mostly outliner bullets; the rest are already
// readable Markdown.
const BULLET_RATIO = 0.5;

// ------------------------------------------------------------------- parsing

const indentWidth = (line) => line.match(/^ */)[0].length;
const BULLET_RE = /^(\s*)([-*+])(?:[ \t]+(.*))?$/;
const FENCE_RE = /^\s*(`{3,}|~{3,})/;

function parse(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  let fence = null;

  function parseBlocks(minIndent) {
    const blocks = [];
    while (i < lines.length) {
      const line = lines[i];
      if (fence) {
        blocks.push({ type: 'text', text: line });
        if (isFenceClose(line, fence)) fence = null;
        i++;
        continue;
      }
      if (line.trim() === '') {
        // A blank that precedes a dedent belongs to the parent level, not this
        // nested block; leave it for the caller so runs stay separated.
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        const nextIndent = j < lines.length ? indentWidth(lines[j]) : -1;
        if (nextIndent !== -1 && nextIndent < minIndent) break;
        blocks.push({ type: 'blank' });
        i++;
        continue;
      }
      const indent = indentWidth(line);
      if (indent < minIndent) break;
      const b = line.match(BULLET_RE);
      if (b) {
        i++;
        const node = {
          type: 'bullet',
          indent,
          text: b[3] ?? '',
          content: [],
          children: [],
        };
        // A fence can open on the bullet line itself (`- ```).
        const open = codeOpener(node.text);
        if (open) fence = open.marker;
        const nested = parseBlocks(indent + 1);
        node.content = nested.filter((x) => x.type !== 'bullet');
        node.children = nested.filter((x) => x.type === 'bullet');
        blocks.push(node);
      } else {
        const open = line.match(FENCE_RE);
        if (open) fence = open[1];
        blocks.push({ type: 'text', text: line });
        i++;
      }
    }
    return blocks;
  }

  return parseBlocks(0);
}

function isFenceClose(line, marker) {
  const m = line.match(/^\s*(`{3,}|~{3,})\s*$/);
  return !!m && m[1][0] === marker[0] && m[1].length >= marker.length;
}

/** A bullet whose text opens a code fence. */
function codeOpener(text) {
  const m = text.trim().match(/^(`{3,}|~{3,})(.*)$/);
  return m ? { marker: m[1], lang: m[2].trim() } : null;
}

// ------------------------------------------------------------------- helpers

const clampLevel = (n) => Math.max(1, Math.min(6, n));

/** `## Title`, `**## Title**`, or `**## Title` -> {level, text}. */
function explicitHeading(text) {
  let t = text.trim();
  const wrap = t.match(/^(\*{1,3})([\s\S]*)\1$/);
  if (wrap) t = wrap[2].trim();
  const m = t.match(/^(#{1,6})\s+(.+?)\s*$/);
  if (m) return { level: m[1].length, text: m[2].trim() };
  return null;
}

const isRefOnly = (s) => /^\s*#(?:\[\[[^\]]+\]\]|[\w-]+)\s*$/.test(s);

/** Heuristic: is this bullet's text a section title rather than a sentence? */
function isHeadingLike(text) {
  const t = text.trim();
  if (t === '') return false;
  if (isRefOnly(t)) return true;
  if (t.length > 100) return false;
  if (/[.!?,;:]$/.test(t)) return false;
  return true;
}

const isLink = (s) => /^!?\[[^\]]*\]\(/.test(s.trim());
const isProperty = (s) => /^\*{0,2}[\w-]+::/.test(s.trim());
const isTaskMarker = (s) => /^#(?:DONE|TODO|DOING|LATER|NOW|WAITING|CANCELED)\b/.test(s.trim());

function isListy(text) {
  const t = text.trim();
  if (t === '') return true;
  if (isLink(t)) return true;
  if (isProperty(t)) return true;
  if (isTaskMarker(t)) return true;
  if (/^#(?:\S|\[\[)/.test(t)) return true;
  if (/^\d+[.)]\s/.test(t)) return true;
  if (/^[-*+]\s/.test(t)) return true;
  if (t.length <= 60 && !/[.!?]$/.test(t)) return true;
  return false;
}

const ORDERED_RE = /^\d+[.)]\s/;

function dedent(lines) {
  const indents = lines.filter((l) => l.trim() !== '').map(indentWidth);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => (l.trim() === '' ? '' : l.slice(min)));
}

function trimBlanks(lines) {
  let a = 0;
  let b = lines.length;
  while (a < b && lines[a].trim() === '') a++;
  while (b > a && lines[b - 1].trim() === '') b--;
  return lines.slice(a, b);
}

function stripListMarker(text) {
  const m = text.match(/^\s*[-*+]\s+([\s\S]*)$/);
  return m ? m[1].trim() : text.trim();
}

// ----------------------------------------------------------------- rendering

function renderBlocks(blocks, depth, parentLevel, listDepth, out) {
  let run = [];
  let rawBuf = [];
  let pendingBlanks = 0;

  const flushRun = () => {
    if (run.length) {
      renderRun(run, depth, parentLevel, listDepth, out);
      run = [];
    }
    pendingBlanks = 0;
  };
  const flushRaw = () => {
    if (rawBuf.length) {
      const text = trimBlanks(rawBuf).join('\n');
      if (text.trim() !== '') out.push({ kind: 'raw', lines: [text] });
      rawBuf = [];
    }
    pendingBlanks = 0;
  };

  for (const b of blocks) {
    if (b.type === 'blank') {
      if (rawBuf.length) rawBuf.push('');
      else {
        flushRun();
        pendingBlanks++;
      }
      continue;
    }
    if (b.type === 'text') {
      flushRun();
      while (pendingBlanks-- > 0) rawBuf.push('');
      rawBuf.push(b.text);
      continue;
    }
    // bullet
    flushRaw();
    if (b.text.trim() === '' && b.children.length === 0) continue; // empty bullet
    if (codeOpener(b.text)) {
      flushRun();
      out.push(codeElement(b.text.trim(), b.content));
      if (b.children.length) renderBlocks(b.children, depth + 1, parentLevel, listDepth, out);
      continue;
    }
    const head = explicitHeading(b.text);
    const promote = !head && b.children.length > 0 && isHeadingLike(b.text);
    if (head || promote) {
      flushRun();
      let level;
      if (head) {
        level = clampLevel(Math.max(head.level, parentLevel + 1));
        out.push({ kind: 'heading', level, text: head.text });
      } else {
        level = clampLevel(Math.max(depth + 2, parentLevel + 1));
        out.push({ kind: 'heading', level, text: b.text.trim() });
      }
      pushContent(b, out);
      // A heading resets list indentation: its children are a fresh block.
      renderBlocks(b.children, depth + 1, level, 0, out);
    } else {
      // A bullet with content or children keeps them attached to the item, so it
      // is emitted on its own rather than merged into a neighbouring run.
      if (b.children.length || hasContent(b)) {
        flushRun();
        renderStandalone(b, depth, parentLevel, listDepth, out);
      } else {
        run.push(b);
      }
    }
  }
  flushRaw();
  flushRun();
}

/** Content lines of a bullet (continuations, code) as elements. */
function pushContent(node, out) {
  const lines = trimBlanks(node.content.map((c) => c.text ?? ''));
  if (lines.length === 0) return;
  const code = [];
  const prose = [];
  let fence = null;
  for (const raw of dedent(lines)) {
    if (fence) {
      code.push(raw);
      if (isFenceClose(raw, fence)) fence = null;
      continue;
    }
    const open = raw.trim().match(/^(`{3,}|~{3,})(.*)$/);
    if (open) {
      if (prose.length) {
        out.push({ kind: 'para', text: prose.join('\n').trim() });
        prose.length = 0;
      }
      fence = open[1];
      code.push(raw.trim());
      continue;
    }
    if (code.length) {
      // a prose line after an unterminated fence: keep it as code
      code.push(raw);
    } else {
      prose.push(raw);
    }
  }
  if (prose.length) out.push({ kind: 'para', text: trimBlanks(prose).join('\n').trim() });
  if (code.length) out.push({ kind: 'code', lines: trimBlanks(code) });
}

function codeElement(opener, content) {
  const body = trimBlanks(dedent(content.map((c) => c.text ?? '')));
  const closing = opener.match(/^(`{3,}|~{3,})/)[1];
  const lines = [opener, ...body];
  if (!isFenceClose(body[body.length - 1] ?? '', closing)) lines.push(closing);
  return { kind: 'code', lines };
}

/** A single bullet that owns content lines or child bullets. */
function renderStandalone(node, depth, parentLevel, listDepth, out) {
  const text = node.text.trim();
  const listy = isListy(node.text);
  if (listy) {
    const item = stripListMarker(text);
    out.push({
      kind: 'list',
      items: [ORDERED_RE.test(item) ? { ordered: true, text: item } : { text: item }],
      depth: listDepth,
    });
  } else if (text !== '') {
    out.push({ kind: 'para', text });
  }
  pushContent(node, out);
  if (node.children.length) {
    // Under a list item, children nest; under a paragraph, they start at the
    // same level so no orphaned indentation is left behind.
    renderBlocks(node.children, depth + 1, parentLevel, listy ? listDepth + 1 : listDepth, out);
  }
}

function hasContent(node) {
  return trimBlanks(node.content.map((c) => c.text ?? '')).length > 0;
}

function renderRun(nodes, depth, parentLevel, listDepth, out) {
  const listyCount = nodes.filter((n) => isListy(n.text)).length;
  const asList = nodes.length > 0 && listyCount / nodes.length >= 0.5;

  const items = [];
  for (const n of nodes) {
    if (asList) {
      const text = stripListMarker(n.text);
      items.push(ORDERED_RE.test(text) ? { ordered: true, text } : { text });
    } else {
      if (n.text.trim() !== '') out.push({ kind: 'para', text: n.text.trim() });
      pushContent(n, out);
    }
  }
  if (asList) {
    out.push({ kind: 'list', items, depth: listDepth });
    for (const n of nodes) pushContent(n, out);
  }
}

function serialize(out) {
  const parts = [];
  for (const el of out) {
    if (el.kind === 'heading') parts.push(`${'#'.repeat(el.level)} ${el.text}`);
    else if (el.kind === 'para') parts.push(el.text);
    else if (el.kind === 'list') {
      const indent = '  '.repeat(el.depth);
      parts.push(el.items.map((t) => (t.ordered ? `${indent}${t.text}` : `${indent}- ${t.text}`)).join('\n'));
    } else if (el.kind === 'code') parts.push(el.lines.join('\n'));
    else if (el.kind === 'raw') parts.push(el.lines.join('\n').trimEnd());
  }
  const text = parts.filter((p) => p.trim() !== '').join('\n\n');
  return text === '' ? '' : `${text}\n`;
}

function transform(text) {
  const blocks = parse(text.replace(/^\uFEFF/, ''));
  const out = [];
  renderBlocks(blocks, 0, 0, 0, out);
  return serialize(out);
}

// ----------------------------------------------------------------------- run

function bulletRatio(text) {
  const lines = text.split('\n');
  let bullets = 0;
  let nonBlank = 0;
  for (const l of lines) {
    if (l.trim() === '') continue;
    nonBlank++;
    if (BULLET_RE.test(l)) bullets++;
  }
  return nonBlank === 0 ? 0 : bullets / nonBlank;
}

/** A Logseq page starts on a bullet; keep files that are already prose. */
function looksLikeOutliner(text) {
  const first = text.split('\n').find((l) => l.trim() !== '') ?? '';
  return BULLET_RE.test(first) || bulletRatio(text) >= BULLET_RATIO;
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => path.join(dir, f));
}

const files = [...listMarkdown(path.join(VAULT, 'pages')), ...listMarkdown(path.join(VAULT, 'journals'))].filter(
  (f) => !only || f.includes(only),
);

let changed = 0;
let skipped = 0;
let unchanged = 0;
let removedLines = 0;
let addedLines = 0;
const samples = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  if (!forceAll && !looksLikeOutliner(text)) {
    skipped++;
    continue;
  }
  const next = transform(text);
  if (next === text) {
    unchanged++;
    continue;
  }
  changed++;
  removedLines += text.split('\n').length;
  addedLines += next.split('\n').length;
  if (samples.length < 10) samples.push({ file, before: text, after: next });
  if (apply) {
    if (backupDir) {
      const rel = path.relative(VAULT, file);
      const dst = path.join(backupDir, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.writeFileSync(dst, text, 'utf8');
    }
    fs.writeFileSync(file, next, 'utf8');
  }
}

console.log(`Vault        : ${VAULT}`);
console.log(`Mode         : ${apply ? 'APPLY' : 'DRY RUN (nothing written)'}`);
console.log(`Files seen   : ${files.length}`);
console.log(`  changed    : ${changed}`);
console.log(`  unchanged  : ${unchanged}`);
console.log(`  skipped    : ${skipped}  (not an outliner file; use --all to include)`);
console.log(`Lines        : ${removedLines} -> ${addedLines}`);
if (samples.length) {
  console.log('\n================ sample 1 of ' + samples.length + ' ================');
  const s = samples[0];
  console.log(`--- ${path.relative(VAULT, s.file)} ---`);
  console.log(s.after);
}
if (apply && backupDir) console.log(`Backup       : ${backupDir}`);
