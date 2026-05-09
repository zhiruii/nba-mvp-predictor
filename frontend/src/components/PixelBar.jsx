const SEGMENTS = 18

export default function PixelBar({ value, max = 1, color = '#ffcc00' }) {
  const filled = Math.round((Math.min(value, max) / max) * SEGMENTS)

  return (
    <div className="pixel-bar-wrap">
      <div className="pixel-bar-track">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className="pixel-bar-seg"
            style={{ background: i < filled ? color : '#1e293b', border: '1px solid #334155' }}
          />
        ))}
      </div>
      <span className="pixel-bar-label">
        {value < 0.001 ? '<0.1%' : `${(value * 100).toFixed(1)}%`}
      </span>
    </div>
  )
}
