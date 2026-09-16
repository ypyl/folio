import type { KeyboardEvent } from 'react'

/**
 * The shared keyboard handling for a search-result list: ArrowUp/ArrowDown move
 * the active row (wrapping), Enter opens it, Escape hands back to the caller.
 * Both search surfaces navigate the same way; only what Escape means and what
 * opening does differ, so both arrive as callbacks. `length` is the number of
 * rows the surface is actually showing (0 while its list is hidden), so a
 * hidden list claims no key.
 */
export function listKeyDown({
  length,
  active,
  setActive,
  onEnter,
  onEscape,
}: {
  length: number
  active: number
  setActive: (next: number) => void
  onEnter: (index: number) => void
  /** Escape's action. Omitted when the caller handles Escape itself. */
  onEscape?: () => void
}): (e: KeyboardEvent) => void {
  return (e) => {
    if (e.key === 'Escape') {
      onEscape?.()
      return
    }
    if (length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(wrap(active + 1, length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(wrap(active - 1, length))
    } else if (e.key === 'Enter') {
      onEnter(active >= 0 ? active : 0)
    }
  }
}

/** Wrap an index into [0, length) for either direction. */
function wrap(index: number, length: number): number {
  return ((index % length) + length) % length
}
