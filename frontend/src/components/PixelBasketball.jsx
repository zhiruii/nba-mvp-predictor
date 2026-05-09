export default function PixelBasketball() {
  return (
    <div className="pixel-basketball-wrap" aria-label="Loading" role="status">
      <svg
        width="48"
        height="56"
        viewBox="0 0 48 56"
        className="pixel-basketball-svg"
        style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* ── Ball body (orange rects approximating a circle) ── */}
        <rect x="16" y="2"  width="16" height="4"  fill="#e67722" />
        <rect x="10" y="6"  width="28" height="4"  fill="#e67722" />
        <rect x="6"  y="10" width="36" height="4"  fill="#e67722" />
        <rect x="4"  y="14" width="40" height="22" fill="#e67722" />
        <rect x="6"  y="36" width="36" height="4"  fill="#e67722" />
        <rect x="10" y="40" width="28" height="4"  fill="#e67722" />
        <rect x="16" y="44" width="16" height="4"  fill="#e67722" />

        {/* ── Horizontal seam ── */}
        <rect x="4"  y="22" width="40" height="4"  fill="#cc5500" />

        {/* ── Vertical seam ── */}
        <rect x="22" y="2"  width="4"  height="46" fill="#cc5500" />

        {/* ── Left arc seam ── */}
        <rect x="14" y="6"  width="4"  height="4"  fill="#cc5500" />
        <rect x="10" y="10" width="4"  height="4"  fill="#cc5500" />
        <rect x="8"  y="14" width="4"  height="6"  fill="#cc5500" />
        <rect x="6"  y="20" width="4"  height="8"  fill="#cc5500" />
        <rect x="8"  y="28" width="4"  height="6"  fill="#cc5500" />
        <rect x="10" y="34" width="4"  height="4"  fill="#cc5500" />
        <rect x="14" y="38" width="4"  height="4"  fill="#cc5500" />

        {/* ── Right arc seam ── */}
        <rect x="30" y="6"  width="4"  height="4"  fill="#cc5500" />
        <rect x="34" y="10" width="4"  height="4"  fill="#cc5500" />
        <rect x="36" y="14" width="4"  height="6"  fill="#cc5500" />
        <rect x="38" y="20" width="4"  height="8"  fill="#cc5500" />
        <rect x="36" y="28" width="4"  height="6"  fill="#cc5500" />
        <rect x="34" y="34" width="4"  height="4"  fill="#cc5500" />
        <rect x="30" y="38" width="4"  height="4"  fill="#cc5500" />

        {/* ── White highlight (top-left of ball) ── */}
        <rect x="10" y="10" width="8"  height="4"  fill="rgba(255,255,255,0.7)" />
        <rect x="10" y="14" width="4"  height="4"  fill="rgba(255,255,255,0.4)" />
      </svg>

      {/* ── Ground shadow ── */}
      <div className="pixel-basketball-shadow" aria-hidden="true" />
    </div>
  )
}
