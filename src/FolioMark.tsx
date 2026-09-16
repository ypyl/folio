// Folio mark - SVG mirror of public/folio-mark.svg.
// Geometry matches the PWA PNG icons. Kami design language (ADR-0011): the
// colours are the DESIGN.md tokens, read through the document's custom
// properties so the mark cannot drift from the stylesheet.
export function FolioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="presentation" aria-hidden="true">
      <rect x="0" y="0" width="512" height="512" rx="112" fill="var(--brand)" />
      <polygon points="256,82 430,256 256,430 82,256" fill="var(--parchment)" />
      <line
        x1="109"
        y1="256"
        x2="403"
        y2="256"
        stroke="var(--brand)"
        strokeOpacity="0.353"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="256"
        y1="109"
        x2="256"
        y2="403"
        stroke="var(--brand)"
        strokeOpacity="0.353"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="185" y="159" width="143" height="194" rx="17" fill="var(--brand)" />
      <rect x="217" y="221" width="78" height="11" rx="5.5" fill="var(--parchment)" />
      <rect x="217" y="250" width="78" height="11" rx="5.5" fill="var(--parchment)" />
      <rect x="231" y="279" width="50" height="11" rx="5.5" fill="var(--parchment)" />
      <polygon points="298,159 328,159 328,189" fill="var(--brand-light)" />
    </svg>
  )
}
