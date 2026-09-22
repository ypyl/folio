#!/usr/bin/env node
// One-way migration: a Logseq graph into a Folio vault.
// Rules live in MIGRATION_LOGSEQ_FOLIO.md; this file implements them and is
// dry-run by default. Nothing is ever written to the source.
//
//   node scripts/migrate-logseq.mjs <logseq-source> <folio-target> [--apply]
//
// Node 22, node:fs/node:path only, no dependencies.

import fs from 'node:fs';
import path from 'node:path';

const USAGE = 'Usage: node scripts/migrate-logseq.mjs <logseq-source> <folio-target> [--apply]';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const positional = args.filter((a) => !a.startsWith('--'));
if (positional.length !== 2) {
  console.error(USAGE);
  process.exit(1);
}
const SRC = path.resolve(positional[0]);
const TGT = path.resolve(positional[1]);

// ---------------------------------------------------------------- name rules

// Characters Logseq percent-encodes that we are willing to decode before
// mapping. Only these; anything else stays a literal `%XX` (a `%` in prose is
// not an escape).
const DECODABLE = new Set([...':"|?>.\\/#%<*']);

// Option B (MIGRATION_LOGSEQ_FOLIO.md §3). Produces a legal Windows filename
// that is visible, has no `]`, and differs from its Logseq name only where the
// original could not be a Folio page name.
function normalizeName(raw) {
  let n = String(raw).trim();
  n = n.replace(/%([0-9A-Fa-f]{2})/g, (m, hex) => {
    const ch = String.fromCharCode(parseInt(hex, 16));
    return DECODABLE.has(ch) ? ch : m;
  });
  n = n.replace(/___/g, '-'); // Logseq's namespace separator (was `/`)
  n = n.replace(/[\\/]/g, '-');
  n = n.replace(/:/g, '-');
  n = n.replace(/"/g, "'");
  n = n.replace(/\|/g, '-');
  n = n.replace(/\?/g, '');
  n = n.replace(/>/g, '-');
  n = n.replace(/</g, '(');
  n = n.replace(/\*/g, 'x');
  n = n.replace(/\[/g, '(');
  n = n.replace(/\]/g, ')');
  n = n.replace(/^\.+/, ''); // a leading dot would hide the file
  n = n.replace(/[. ]+$/, ''); // Windows forbids a trailing dot or space
  return n.trim();
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** `Apr 30th, 2025` -> `2025-04-30`, else null. */
function humanDate(name) {
  const m = name.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!month) return null;
  const day = Number(m[2]);
  const year = Number(m[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Journal stems: `2024_07_02` -> `2024-07-02`, otherwise normalized. */
function journalName(stem) {
  return /^\d{4}_\d{2}_\d{2}$/.test(stem) ? stem.replace(/_/g, '-') : normalizeName(stem);
}

const isDay = (name) => /^\d{4}-\d{2}-\d{2}$/.test(name) && humanDateOk(name);
function humanDateOk(name) {
  const [y, m, d] = name.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// ------------------------------------------------------------- file listing

const toPosix = (p) => p.split(path.sep).join('/');

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  (function rec(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.')) continue;
        rec(abs);
      } else if (entry.isFile()) {
        out.push(toPosix(path.relative(dir, abs)));
      }
    }
  })(dir);
  return out;
}

const hidden = (rel) => rel.split('/').some((seg) => seg.startsWith('.'));
const stemOf = (rel) => path.basename(rel).replace(/\.md$/i, '');

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

// ---------------------------------------------------------------- gather plan

const pages = []; // { srcRel, srcAbs, name, outRel }
const journals = []; // { srcRel, srcAbs, name }
const assets = []; // { srcAbs, outRel }
const notes = []; // human-readable report notes

for (const rel of listFiles(path.join(SRC, 'pages'))) {
  if (!rel.toLowerCase().endsWith('.md') || hidden(rel)) continue;
  if (rel.startsWith('.folio/') || rel.startsWith('journals/')) continue; // stray Folio artifacts
  const name = normalizeName(stemOf(rel));
  pages.push({ srcRel: `pages/${rel}`, srcAbs: path.join(SRC, 'pages', rel), name, outRel: `pages/${name}.md` });
}

for (const rel of listFiles(path.join(SRC, 'journals'))) {
  if (!rel.toLowerCase().endsWith('.md') || hidden(rel)) continue;
  const name = journalName(stemOf(rel));
  journals.push({ srcRel: `journals/${rel}`, srcAbs: path.join(SRC, 'journals', rel), name });
}

// Stray Folio artifacts nested in the Logseq pages/ folder: fold their journals in.
for (const rel of listFiles(path.join(SRC, 'pages', 'journals'))) {
  if (!rel.toLowerCase().endsWith('.md') || hidden(rel)) continue;
  const name = journalName(stemOf(rel));
  journals.push({ srcRel: `pages/journals/${rel}`, srcAbs: path.join(SRC, 'pages', 'journals', rel), name });
}

for (const rel of listFiles(path.join(SRC, 'assets'))) {
  if (hidden(rel)) continue;
  assets.push({ srcAbs: path.join(SRC, 'assets', rel), outRel: `assets/${rel}` });
}
for (const dir of ['draws', 'whiteboards']) {
  for (const rel of listFiles(path.join(SRC, dir))) {
    if (hidden(rel)) continue;
    assets.push({ srcAbs: path.join(SRC, dir, rel), outRel: `assets/${path.basename(rel)}` });
  }
}

// Initial collisions: two sources mapping to one output path.
const outFiles = new Map(); // outRel(lower) -> { rel, sources: Set }
const addOut = (outRel, label) => {
  const key = outRel.toLowerCase();
  const entry = outFiles.get(key) ?? { rel: outRel, sources: new Set() };
  entry.sources.add(label);
  outFiles.set(key, entry);
};
for (const p of pages) addOut(p.outRel, p.srcRel);
for (const j of journals) addOut(`journals/${j.name}.md`, j.srcRel);
for (const a of assets) addOut(a.outRel, `asset:${a.srcAbs}`);

// Two distinct pages normalizing to one name is reported, and the first source
// wins. Two journal sources mapping to one day is the intended fold (§9).
const sourceCollisions = [...outFiles.values()].filter(
  (e) => e.sources.size > 1 && !e.rel.startsWith('journals/'),
);

// Existing destination paths are no longer blockers: a Markdown target is
// appended to and an asset is skipped (merge-logseq-imports).
const collisions = sourceCollisions.map((e) => ({
  rel: e.rel,
  list: [...e.sources],
  why: 'two sources map here (first wins)',
}));

// Name map for reference resolution and block-ref targets.
const nameBySource = new Map(); // srcRel -> output page name
for (const p of pages) nameBySource.set(p.srcRel, p.name);
for (const j of journals) nameBySource.set(j.srcRel, j.name);

const outputNames = new Set();
for (const p of pages) outputNames.add(p.name.toLowerCase());
for (const j of journals) outputNames.add(j.name.toLowerCase());

// Block refs: uuid -> owning page name.
const uuidToName = new Map();
for (const item of [...pages.map((p) => p.srcRel), ...journals.map((j) => j.srcRel)]) {
  const abs = nameBySource.has(item) ? path.join(SRC, item) : null;
  if (!abs) continue;
  const text = readText(abs);
  for (const m of text.matchAll(/\bid::\s*([0-9a-fA-F-]{36})/g)) {
    uuidToName.set(m[1].toLowerCase(), nameBySource.get(item));
  }
}

// ---------------------------------------------------------- content rewriter

const TASK_KEYS = new Set(['DONE', 'TODO', 'DOING', 'LATER', 'NOW']);
const stats = {
  plainWikilinks: 0,
  bracketedNormalized: 0,
  aliasedLinks: 0,
  humanDates: 0,
  blockRefs: 0,
  blockRefsUnresolved: 0,
  taskRefs: 0,
  droppedProps: 0,
  droppedTitles: 0,
  droppedDrawer: 0,
  assetLinks: 0,
};
const refTargets = new Map(); // lowercased target -> Set(source label)
const assetRefs = new Map(); // out asset path -> Set(source label)

const recordRef = (target, source) => {
  const key = target.toLowerCase();
  const set = refTargets.get(key) ?? new Set();
  set.add(source);
  refTargets.set(key, set);
};

const FENCE_OPEN = /^(\s*)(?:[-*]\s+)?(`{3,}|~{3,})/;
const FENCE_CLOSE = /^(\s*)(`{3,}|~{3,})\s*$/;

function rewriteContent(text, pageName, sourceLabel, srcStem) {
  const lines = text.split('\n');
  const out = [];
  let fence = null;
  for (const raw of lines) {
    // Indentation: Logseq nests with tabs, Folio writes two spaces per level.
    let line = raw.replace(/^\t+/, (m) => '  '.repeat(m.length));

    const fm = line.match(FENCE_OPEN);
    if (fence) {
      const cm = line.match(FENCE_CLOSE);
      if (cm && cm[2][0] === fence[0] && cm[2].length >= fence.length) fence = null;
      out.push(line);
      continue;
    }
    if (fm) {
      fence = fm[2];
      out.push(line);
      continue;
    }

    // Property lines: app noise is dropped, user data is kept. `collapsed::`
    // and `query-table::` are also dropped when Logseq wrote them as a bullet.
    if (
      /^\s*(?:[-*]\s+)?(?:collapsed|query-table)::/.test(line) ||
      /^\s*(?:id|template)::/.test(line)
    ) {
      stats.droppedProps++;
      continue;
    }
    const titleProp = line.match(/^\s*title::\s*(.*)$/);
    if (titleProp && titleProp[1].trim() === srcStem) {
      stats.droppedTitles++;
      continue;
    }
    if (/^\s*:LOGBOOK:\s*$/.test(line) || /^\s*:END:\s*$/.test(line)) {
      stats.droppedDrawer++;
      continue;
    }

    // Task state becomes a page reference: `- DONE x` -> `- #DONE x`.
    line = line.replace(/^(\s*[-*]\s+)(DONE|TODO|DOING|LATER|NOW)(?=\s|$)/, (_m, lead, key) => {
      stats.taskRefs++;
      recordRef(key, sourceLabel);
      return `${lead}#${key}`;
    });

    // Asset destinations are vault-root-relative in Folio.
    line = line.replace(/\]\((?:(\.\.\/))?(assets|draws|whiteboards)\//g, (_m, up) => {
      if (up) stats.assetLinks++;
      return '](assets/';
    });
    // Remaining `../assets/` occurrences (e.g. `file-path::` values) too.
    line = line.replace(/\.\.\/(assets|draws|whiteboards)\//g, 'assets/');
    for (const m of line.matchAll(/\]\((assets\/(?:[^()]|\([^()]*\))+)\)/g)) {
      const target = m[1];
      const set = assetRefs.get(target) ?? new Set();
      set.add(sourceLabel);
      assetRefs.set(target, set);
    }

    // Page references: `[[X]]` -> `#[[X]]`, `#[[X]]` normalized. Aliases are
    // dropped (Folio has no alias form).
    line = line.replace(/(#?)\[\[([^[\]]+)\]\]/g, (_m, hash, inner) => {
      const hadAlias = inner.includes('|');
      let name = (hadAlias ? inner.split('|')[0] : inner).trim();
      if (name === '') return _m;
      if (hadAlias) stats.aliasedLinks++;
      const date = humanDate(name);
      if (date) {
        stats.humanDates++;
        name = date;
      } else {
        name = normalizeName(name);
      }
      if (hash === '#') stats.bracketedNormalized++;
      else stats.plainWikilinks++;
      recordRef(name, sourceLabel);
      return `#[[${name}]]`;
    });

    // Block references flatten to the page that owns the block.
    line = line.replace(/\(\(([0-9a-fA-F-]{36})\)\)/g, (m, uuid) => {
      const owner = uuidToName.get(uuid.toLowerCase());
      if (!owner) {
        stats.blockRefsUnresolved++;
        return m;
      }
      stats.blockRefs++;
      recordRef(owner, sourceLabel);
      return `#[[${owner}]]`;
    });

    out.push(line);
  }
  return out.join('\n');
}

// --------------------------------------------------------------- render plan

// The hidden ledger of imported source files (merge-logseq-imports): one entry
// per imported file, keyed `<source folder name>\t<source path>`. It is
// app-owned vault meta, never a page (ADR-0015).
const LEDGER_HEADER = '# Imported Logseq sources - one entry per imported file';
const sourceName = path.basename(SRC);
const LEDGER = path.join(TGT, '.folio', 'imports.md');
const ledger = new Set();
try {
  for (const line of fs.readFileSync(LEDGER, 'utf8').split('\n')) {
    const m = line.match(/^-\s+(.*)$/);
    if (m) ledger.add(m[1].trimEnd());
  }
} catch {
  // no ledger yet
}
const keyOf = (srcRel) => `${sourceName}\t${srcRel}`;
const freshPages = pages.filter((p) => !ledger.has(keyOf(p.srcRel)));
const freshJournals = journals.filter((j) => !ledger.has(keyOf(j.srcRel)));
const alreadyImported =
  pages.length - freshPages.length + (journals.length - freshJournals.length);

const journalGroups = new Map(); // outRel -> { parts, sourceKeys }
for (const j of freshJournals) {
  const outRel = `journals/${j.name}.md`;
  const group = journalGroups.get(outRel) ?? { parts: [], sourceKeys: [] };
  group.parts.push(rewriteContent(readText(j.srcAbs), j.name, j.srcRel, stemOf(j.srcRel)));
  group.sourceKeys.push(keyOf(j.srcRel));
  journalGroups.set(outRel, group);
}

const writes = []; // { outRel, content, sourceKeys }
const seenPages = new Set();
for (const p of freshPages) {
  const key = p.outRel.toLowerCase();
  if (seenPages.has(key)) continue; // first source wins on a name collision
  seenPages.add(key);
  const content = rewriteContent(readText(p.srcAbs), p.name, p.srcRel, stemOf(p.srcRel));
  writes.push({ outRel: p.outRel, content, sourceKeys: [keyOf(p.srcRel)] });
}
for (const [outRel, group] of journalGroups) {
  writes.push({ outRel, content: group.parts.join('\n'), sourceKeys: group.sourceKeys });
}

// Illegal-name guard: nothing should survive normalization that Windows or
// Folio would reject.
const badNames = [...pages, ...journals].filter(
  (x) =>
    x.name === '' ||
    /[<>:"|?*]/.test(x.name) ||
    /[. ]$/.test(x.name) ||
    [...x.name].some((c) => c.charCodeAt(0) < 32),
);

// Markers that should not survive: leftovers mean an unbalanced code fence in
// the source made a region look like code, so it was left untouched.
const leftovers = writes
  .filter((w) => /collapsed::|\(\([0-9a-f-]{36}\)\)|\.\.\/assets\//.test(w.content))
  .map((w) => w.outRel)
  .sort();

// Reference targets that land nowhere.
const knownJournals = new Set([...journalGroups.keys()].map((r) => r.replace(/^journals\//, '').replace(/\.md$/, '').toLowerCase()));
const dangling = [];
for (const [target, sources] of refTargets) {
  if (TASK_KEYS.has(target.toUpperCase())) continue; // intentional new state pages
  if (isDay(target) && knownJournals.has(target)) continue;
  if (outputNames.has(target)) continue;
  if (isDay(target)) continue; // journal day, materialized on open
  dangling.push({ target, sources: [...sources] });
}
dangling.sort((a, b) => b.sources.length - a.sources.length || a.target.localeCompare(b.target));

const assetSet = new Set(assets.map((a) => a.outRel.toLowerCase()));
const missingAssets = [];
for (const [target, sources] of assetRefs) {
  if (!assetSet.has(target.toLowerCase())) missingAssets.push({ target, sources: [...sources] });
}

// ------------------------------------------------------------------- report

const pageRenames = pages.filter((p) => stemOf(p.srcRel) !== p.name);
const journalRenames = journals.filter((j) => stemOf(j.srcRel) !== j.name);
const line = (label, value) => console.log(value === undefined ? String(label) : `${label.padEnd(34)} ${value}`);

console.log(`Logseq source : ${SRC}`);
console.log(`Folio target  : ${TGT}`);
console.log(`Mode          : ${apply ? 'APPLY' : 'DRY RUN (nothing is written)'}`);
console.log('');

console.log('== Inventory ==');
line('pages', pages.length);
line('journals', journals.length);
line('  (folded from pages/journals)', journals.filter((j) => j.srcRel.startsWith('pages/journals/')).length);
line('assets + drawings', assets.length);
line('');

console.log('== Rewrites ==');
for (const [key, value] of Object.entries(stats)) line(`  ${key}`, value);
line('  refs recorded', refTargets.size);
line('');

console.log(`== Page renames (${pageRenames.length}) ==`);
for (const r of pageRenames) {
  console.log(`  ${stemOf(r.srcRel)}`);
  console.log(`    -> ${r.name}`);
}
if (pageRenames.length === 0) console.log('  (none)');
console.log('');
console.log(`== Journal renames (${journalRenames.length}) ==      underscore dates -> hyphens`);
console.log('');

console.log(`== Dangling page references (${dangling.length}) ==`);
for (const d of dangling.slice(0, 40)) {
  console.log(`  ${d.target}  <-- ${d.sources.length} source(s): ${d.sources.slice(0, 3).join(', ')}${d.sources.length > 3 ? ', ...' : ''}`);
}
if (dangling.length > 40) console.log(`  ... and ${dangling.length - 40} more`);
if (dangling.length === 0) console.log('  (none)');
console.log('');

console.log(`== Asset references with no file (${missingAssets.length}) ==`);
for (const m of missingAssets) console.log(`  ${m.target}  <-- ${m.sources.join(', ')}`);
if (missingAssets.length === 0) console.log('  (none)');
console.log('');

console.log(`== Leftovers to review (${leftovers.length}) ==`);
for (const rel of leftovers) console.log(`  ${rel}`);
if (leftovers.length === 0) console.log('  (none)');
console.log('');

console.log(`== Illegal output names (${badNames.length}) ==`);
for (const b of badNames) console.log(`  ${JSON.stringify(b.name)} <- ${b.srcRel}`);
if (badNames.length === 0) console.log('  (none)');
console.log('');

console.log(`== Collisions (${collisions.length}) ==`);
for (const c of collisions) console.log(`  ${c.rel} (${c.why}): ${c.list.join(' + ')}`);
if (collisions.length === 0) console.log('  (none)');
console.log('');

if (notes.length) {
  console.log('== Notes ==');
  for (const n of notes) console.log(`  ${n}`);
  console.log('');
}

// -------------------------------------------------------------------- apply

if (!apply) {
  console.log('Dry run complete. Re-run with --apply to write the vault.');
  process.exit(0);
}

let written = 0;
let merged = 0;
let skipped = 0;
let assetsCopied = 0;

const record = (sourceKeys) => {
  for (const key of sourceKeys) ledger.add(key);
  const body = [...ledger]
    .sort()
    .map((key) => `- ${key}`)
    .join('\n');
  fs.mkdirSync(path.join(TGT, '.folio'), { recursive: true });
  fs.writeFileSync(
    LEDGER,
    body === '' ? `${LEDGER_HEADER}\n` : `${LEDGER_HEADER}\n\n${body}\n`,
    'utf8',
  );
};

for (const w of writes) {
  const abs = path.join(TGT, w.outRel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs)) {
    const prior = fs.readFileSync(abs, 'utf8').replace(/\n+$/, '');
    const body = w.content.replace(/\n+$/, '');
    fs.writeFileSync(abs, prior === '' ? `${body}\n` : `${prior}\n\n${body}\n`, 'utf8');
    merged++;
  } else {
    fs.writeFileSync(abs, w.content.endsWith('\n') ? w.content : `${w.content}\n`, 'utf8');
    written++;
  }
  record(w.sourceKeys);
}
for (const a of assets) {
  const abs = path.join(TGT, a.outRel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs)) {
    skipped++;
    continue;
  }
  fs.copyFileSync(a.srcAbs, abs);
  assetsCopied++;
}
console.log(
  `Applied: ${written} written, ${merged} merged, ${assetsCopied} assets copied, ${skipped} assets skipped, ${alreadyImported} source files already imported. Source untouched.`,
);
