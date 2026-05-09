export default function Locker({ title, sublabel, interior, badge, onClick }) {
  return (
    <button
      className="locker"
      onClick={onClick}
      aria-label={`Navigate to ${title}`}
    >
      {/* Badge icon pinned to the top */}
      {badge && (
        <div className="locker-badge-top" aria-hidden="true">
          {badge}
        </div>
      )}

      {/* Rivets */}
      <div className="locker-rivets">
        <div className="locker-rivet" />
        <div className="locker-rivet" />
      </div>

      {/* Vent slats */}
      <div className="locker-vents">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="locker-vent-line" />
        ))}
      </div>

      {/* Interior scene */}
      <div className="locker-interior">
        {interior}
      </div>

      {/* Handle */}
      <div className="locker-handle" aria-hidden="true" />

      {/* Labels */}
      <span className="locker-label">{title}</span>
      <span className="locker-sublabel">{sublabel}</span>
    </button>
  )
}
