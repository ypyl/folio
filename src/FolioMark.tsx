// Folio mark - SVG mirror of public/folio-mark.svg.
// Geometry matches the PWA PNG icons. Kami design language (ADR-0011):
// ink-blue #1B365D, parchment #f5f4ed, ink-light #2D5A8A.
export function FolioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="presentation" aria-hidden="true">
      <rect x="0" y="0" width="512" height="512" rx="112" fill="#1B365D" />
      <polygon points="256,82 430,256 256,430 82,256" fill="#f5f4ed" />
      <line
        x1="109"
        y1="256"
        x2="403"
        y2="256"
        stroke="#1B365D"
        strokeOpacity="0.353"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="256"
        y1="109"
        x2="256"
        y2="403"
        stroke="#1B365D"
        strokeOpacity="0.353"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="185" y="159" width="143" height="194" rx="17" fill="#1B365D" />
      <rect x="217" y="221" width="78" height="11" rx="5.5" fill="#f5f4ed" />
      <rect x="217" y="250" width="78" height="11" rx="5.5" fill="#f5f4ed" />
      <rect x="231" y="279" width="50" height="11" rx="5.5" fill="#f5f4ed" />
      <polygon points="298,159 328,159 328,189" fill="#2D5A8A" />
    </svg>
  )
}
