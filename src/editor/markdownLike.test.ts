import { describe, expect, it } from 'vitest'
import { looksLikeMarkdown } from './markdownLike'

// The sniff rule (paste-as-markdown, design D1): block-level signals at
// line start, corroboration by count and density. Every case here pins the
// accepted threshold — see the delta spec scenarios' boundaries.

describe('looksLikeMarkdown', () => {
  it('parses a full document like the sample/todo.md paste', () => {
    const doc = [
      '# Sample Markdown',
      '',
      'This is a **bold** statement and this is *italic* text.',
      '',
      '- Item one',
      '- Item two',
      '- Item three',
      '',
      '1. First step',
      '2. Second step',
      '3. Third step',
      '',
      '> This is a blockquote.',
      '',
      '[Example link](https://example.com)',
      '',
      '```csharp',
      'public void Hello()',
      '{',
      '    Console.WriteLine("Hello, world!");',
      '}',
      '```',
    ].join('\n')
    expect(looksLikeMarkdown(doc)).toBe(true)
  })

  it('parses a plan-style doc with headings and task lists', () => {
    const doc = [
      '# Plan',
      '',
      '- [x] **UI shell** — colors and spacing',
      '- [x] **Static navigation**',
      '- [ ] **VaultStorage** interface',
      '',
      '## Later ideas',
      '',
      '- Asset rendering',
      '- Orphan asset cleanup',
    ].join('\n')
    expect(looksLikeMarkdown(doc)).toBe(true)
  })

  it('parses a lone list of ten bullets', () => {
    const bullets = Array.from({ length: 10 }, (_, i) => `- item ${i + 1}`).join('\n')
    expect(looksLikeMarkdown(bullets)).toBe(true)
  })

  it('keeps inline-only markers literal', () => {
    expect(looksLikeMarkdown('**wow**')).toBe(false)
    expect(looksLikeMarkdown('*wow* and `code` and a [link](https://x.y)')).toBe(false)
  })

  it('keeps prose with one stray list line literal', () => {
    const transcript = [
      'Hey, here are the notes from today:',
      'the demo went well overall',
      'we should revisit the numbers next week',
      '- booth location',
      'and also talk to the ops team before then',
      'let me know what you think',
    ].join('\n')
    expect(looksLikeMarkdown(transcript)).toBe(false)
  })

  it('keeps a lone heading line literal', () => {
    expect(looksLikeMarkdown('# Title')).toBe(false)
    expect(looksLikeMarkdown('## Deeply quoted thought')).toBe(false)
  })

  it('parses fence-only text', () => {
    expect(looksLikeMarkdown('```\nconst x = 1\n```')).toBe(true)
    expect(looksLikeMarkdown('~~~sql\nSELECT 1;\n~~~')).toBe(true)
  })

  it('keeps an empty or blank string literal', () => {
    expect(looksLikeMarkdown('')).toBe(false)
    expect(looksLikeMarkdown('   \n\t\n  ')).toBe(false)
  })

  it('does not treat indented code comments as headings', () => {
    // 4-space indentation is outside Markdown's block-signal indent budget.
    expect(looksLikeMarkdown('    # comment\n    value = 1')).toBe(false)
  })
})