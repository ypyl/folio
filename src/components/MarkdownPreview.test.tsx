import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownPreview } from './MarkdownPreview'

describe('MarkdownPreview micro-renderer', () => {
  it('renders ATX headings at their level', () => {
    render(<MarkdownPreview content={'# One\n\n## Two'} />)
    expect(screen.getByRole('heading', { level: 1, name: 'One' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Two' })).toBeTruthy()
  })

  it('renders paragraphs as text', () => {
    render(<MarkdownPreview content={'Plain paragraph text.'} />)
    expect(screen.getByText('Plain paragraph text.')).toBeTruthy()
  })

  it('renders [[Page]] and #tag references as inert chips', () => {
    render(<MarkdownPreview content={'See [[Inbox]] and #reading'} />)
    expect(screen.getByText('Inbox')).toBeTruthy()
    expect(screen.getByText('reading')).toBeTruthy()
  })

  it('treats a bare #tag line as a paragraph, not a heading', () => {
    render(<MarkdownPreview content={'#notes #intro'} />)
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByText('notes')).toBeTruthy()
    expect(screen.getByText('intro')).toBeTruthy()
  })
})