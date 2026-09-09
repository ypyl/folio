// The pin star (add-pinned-pages): a 24-viewBox star — filled when pinned,
// outlined when not. aria-hidden: pin state is conveyed by its container
// (the status-bar button's aria-pressed, or the row's data-pinned style
// marker), never by the glyph itself. Size via the `className` at the use
// site (currentColor drives fill/stroke).
export function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 17.2l-5.2 2.5 1-5.9-4.3-4.1 5.9-.9z" />
    </svg>
  )
}