import styles from './PaneCollapseToggle.module.css'

// A pane's collapse control (add-collapsible-sidebars): the full-height strip
// on the pane's outer edge. The glyph points toward the pane's own edge while
// the pane is expanded and toward the editor while it is collapsed, so the
// arrow always says where the pane goes. The glyph is `aria-hidden`; the
// button's accessible name and `aria-expanded` carry the meaning, the same
// rule the pin star and the Back/Forward chevrons follow.
function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.icon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

export function PaneCollapseToggle({
  side,
  collapsed,
  controls,
  onToggle,
}: {
  /** Which side of the workspace the strip sits on. The left strip collapses
   *  the sidebar and points left while expanded; the right strip collapses the
   *  meta panel and points right. */
  side: 'left' | 'right'
  collapsed: boolean
  /** The id of the pane this strip controls, so `aria-controls` names it. */
  controls: string
  onToggle: () => void
}) {
  const pane = side === 'left' ? 'sidebar' : 'meta panel'
  const label = `${collapsed ? 'Expand' : 'Collapse'} ${pane}`
  // Expanded, the arrow points at the pane's outer edge (left strip → left,
  // right strip → right); collapsed, it points back toward the editor.
  const pointsLeft = collapsed ? side === 'right' : side === 'left'
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={label}
      aria-expanded={!collapsed}
      aria-controls={controls}
      onClick={onToggle}
    >
      <ChevronIcon direction={pointsLeft ? 'left' : 'right'} />
    </button>
  )
}
