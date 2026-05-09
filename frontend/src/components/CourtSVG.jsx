// Pixel art fan: head + body + raised arms + legs. animDelay in ms.
function Fan({ x, y, jersey, skin, animDelay }) {
  return (
    <g style={{ animation: `fan-bounce 0.7s step-start ${animDelay}ms infinite` }}>
      {/* Head */}
      <rect x={x}     y={y}      width={8}  height={8}  fill={skin} />
      {/* Hair */}
      <rect x={x}     y={y}      width={8}  height={2}  fill="#2a1a0a" />
      {/* Body / jersey */}
      <rect x={x - 2} y={y + 8}  width={12} height={12} fill={jersey} />
      {/* Arms raised */}
      <rect x={x - 8} y={y + 2}  width={7}  height={4}  fill={skin} />
      <rect x={x + 9} y={y + 2}  width={7}  height={4}  fill={skin} />
      {/* Legs */}
      <rect x={x}     y={y + 20} width={4}  height={8}  fill="#1a2a5a" />
      <rect x={x + 5} y={y + 20} width={4}  height={8}  fill="#1a2a5a" />
      {/* Feet */}
      <rect x={x - 1} y={y + 27} width={6}  height={3}  fill="#111" />
      <rect x={x + 4} y={y + 27} width={6}  height={3}  fill="#111" />
    </g>
  )
}

const LEFT_FANS = [
  { x: 28,  y: 155, jersey: '#cc2222', skin: '#f4c2a1', delay: 0   },
  { x: 52,  y: 170, jersey: '#2244cc', skin: '#c8965a', delay: 200 },
  { x: 28,  y: 210, jersey: '#228833', skin: '#f4c2a1', delay: 100 },
  { x: 52,  y: 230, jersey: '#cc6600', skin: '#8b5e3c', delay: 350 },
  { x: 28,  y: 268, jersey: '#882288', skin: '#f0d0b0', delay: 150 },
  { x: 52,  y: 285, jersey: '#cc2244', skin: '#c8965a', delay: 280 },
]

const RIGHT_FANS = [
  { x: 862, y: 155, jersey: '#2244cc', skin: '#f4c2a1', delay: 120 },
  { x: 886, y: 175, jersey: '#cc2222', skin: '#8b5e3c', delay: 0   },
  { x: 862, y: 215, jersey: '#cc6600', skin: '#f0d0b0', delay: 250 },
  { x: 886, y: 235, jersey: '#228833', skin: '#c8965a', delay: 80  },
  { x: 862, y: 268, jersey: '#cc2244', skin: '#f4c2a1', delay: 320 },
  { x: 886, y: 288, jersey: '#882288', skin: '#8b5e3c', delay: 180 },
]

export default function CourtSVG() {
  return (
    <svg
      viewBox="0 0 940 440"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {/* Floor base */}
      <rect width="940" height="440" fill="#c8965a" />

      {/* Hardwood plank lines */}
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1="0" y1={i * 20} x2="940" y2={i * 20}
          stroke="#a87040" strokeWidth="1.5" opacity="0.6" />
      ))}

      {/* Outer boundary */}
      <rect x="20" y="20" width="900" height="400"
        fill="none" stroke="#f0e6c8" strokeWidth="4" />

      {/* Half-court line */}
      <line x1="470" y1="20" x2="470" y2="420"
        stroke="#f0e6c8" strokeWidth="4" />

      {/* Center circle */}
      <circle cx="470" cy="220" r="60"
        fill="none" stroke="#f0e6c8" strokeWidth="4" />

      {/* Left paint */}
      <rect x="20" y="145" width="185" height="150"
        fill="rgba(20,40,100,0.2)" stroke="#f0e6c8" strokeWidth="3" />

      {/* Right paint */}
      <rect x="735" y="145" width="185" height="150"
        fill="rgba(20,40,100,0.2)" stroke="#f0e6c8" strokeWidth="3" />

      {/* Left free-throw circle */}
      <path d="M 205 145 A 60 60 0 0 1 205 295"
        fill="none" stroke="#f0e6c8" strokeWidth="3" />
      <path d="M 205 145 A 60 60 0 0 0 205 295"
        fill="none" stroke="#f0e6c8" strokeWidth="3" strokeDasharray="8 6" />

      {/* Right free-throw circle */}
      <path d="M 735 145 A 60 60 0 0 0 735 295"
        fill="none" stroke="#f0e6c8" strokeWidth="3" />
      <path d="M 735 145 A 60 60 0 0 1 735 295"
        fill="none" stroke="#f0e6c8" strokeWidth="3" strokeDasharray="8 6" />

      {/* Left 3-pt arc */}
      <path d="M 20 90 L 90 90 A 200 200 0 0 1 90 350 L 20 350"
        fill="none" stroke="#f0e6c8" strokeWidth="3" />

      {/* Right 3-pt arc */}
      <path d="M 920 90 L 850 90 A 200 200 0 0 0 850 350 L 920 350"
        fill="none" stroke="#f0e6c8" strokeWidth="3" />

      {/* Left backboard */}
      <rect x="20" y="200" width="14" height="40" fill="#f0e6c8" />

      {/* Left rim */}
      <circle cx="56" cy="220" r="13" fill="none" stroke="#ef4444" strokeWidth="4" />
      <line x1="34" y1="220" x2="56" y2="220" stroke="#888" strokeWidth="3" />

      {/* Right backboard */}
      <rect x="906" y="200" width="14" height="40" fill="#f0e6c8" />

      {/* Right rim */}
      <circle cx="884" cy="220" r="13" fill="none" stroke="#ef4444" strokeWidth="4" />
      <line x1="906" y1="220" x2="884" y2="220" stroke="#888" strokeWidth="3" />

      {/* Restricted area arcs */}
      <path d="M 56 207 A 40 40 0 0 1 56 233"
        fill="none" stroke="#f0e6c8" strokeWidth="2" />
      <path d="M 884 207 A 40 40 0 0 0 884 233"
        fill="none" stroke="#f0e6c8" strokeWidth="2" />

      {/* Bleachers top + bottom */}
      <rect x="0" y="0"   width="940" height="16" fill="#1e293b" />
      <rect x="0" y="424" width="940" height="16" fill="#1e293b" />
      {Array.from({ length: 47 }, (_, i) => (
        <rect key={`t${i}`} x={i * 20 + 2} y={3} width="14" height="8"
          fill={i % 3 === 0 ? '#334155' : i % 3 === 1 ? '#1e293b' : '#293548'} />
      ))}
      {Array.from({ length: 47 }, (_, i) => (
        <rect key={`b${i}`} x={i * 20 + 2} y={429} width="14" height="8"
          fill={i % 3 === 0 ? '#334155' : i % 3 === 1 ? '#1e293b' : '#293548'} />
      ))}

      {/* Dark overlay */}
      <rect width="940" height="440" fill="rgba(0,0,0,0.25)" />

      {/* ── Animated fans ───────────────────────────────────── */}
      {LEFT_FANS.map((f, i) => (
        <Fan key={`lf${i}`} x={f.x} y={f.y} jersey={f.jersey} skin={f.skin} animDelay={f.delay} />
      ))}
      {RIGHT_FANS.map((f, i) => (
        <Fan key={`rf${i}`} x={f.x} y={f.y} jersey={f.jersey} skin={f.skin} animDelay={f.delay} />
      ))}
    </svg>
  )
}
