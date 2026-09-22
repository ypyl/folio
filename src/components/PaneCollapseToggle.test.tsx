import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PaneCollapseToggle } from './PaneCollapseToggle'

// The arrow is decoration (aria-hidden) whose direction is the only thing that
// encodes "collapse" vs "expand" (add-collapsible-sidebars). The path's start
// point is the cheapest way to read it: a left chevron opens at x=15, a right
// one at x=9.
function arrowPoints(container: HTMLElement): 'left' | 'right' {
  const d = container.querySelector('path')?.getAttribute('d') ?? ''
  return d.startsWith('M15') ? 'left' : 'right'
}

describe('pane collapse toggle', () => {
  it('names the sidebar and shows it expanded, pointing at its outer edge', () => {
    const { container } = render(
      <PaneCollapseToggle
        side="left"
        collapsed={false}
        controls="sidebar-pane"
        onToggle={() => {}}
      />,
    )
    const button = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-controls')).toBe('sidebar-pane')
    expect(arrowPoints(container)).toBe('left')
  })

  it('points back toward the editor once the sidebar is collapsed', () => {
    const { container } = render(
      <PaneCollapseToggle side="left" collapsed controls="sidebar-pane" onToggle={() => {}} />,
    )
    const button = screen.getByRole('button', { name: 'Expand sidebar' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(arrowPoints(container)).toBe('right')
  })

  it('mirrors the arrows on the right side', () => {
    const expanded = render(
      <PaneCollapseToggle
        side="right"
        collapsed={false}
        controls="meta-panel"
        onToggle={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Collapse meta panel' }).getAttribute('aria-expanded'),
    ).toBe('true')
    expect(arrowPoints(expanded.container)).toBe('right')
    const collapsed = render(
      <PaneCollapseToggle side="right" collapsed controls="meta-panel" onToggle={() => {}} />,
    )
    expect(
      screen.getByRole('button', { name: 'Expand meta panel' }).getAttribute('aria-expanded'),
    ).toBe('false')
    expect(arrowPoints(collapsed.container)).toBe('left')
  })

  it('toggles through the click handler', () => {
    const onToggle = vi.fn()
    render(
      <PaneCollapseToggle
        side="left"
        collapsed={false}
        controls="sidebar-pane"
        onToggle={onToggle}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
