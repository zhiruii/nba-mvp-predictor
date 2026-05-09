import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSeason } from '../api'
import PixelBar from '../components/PixelBar'
import CourtSVG from '../components/CourtSVG'
import Locker from '../components/Locker'
import PixelBasketball from '../components/PixelBasketball'

// ── Locker interior scenes ──────────────────────────────────────

const HistoricalInterior = () => (
  <svg viewBox="0 0 160 148" width="160" height="148"
    style={{ imageRendering: 'pixelated', display: 'block' }} aria-hidden="true">
    {/* Interior wall */}
    <rect width="160" height="148" fill="#1a2a34" />
    {/* Hook rail */}
    <rect x="0" y="10" width="160" height="4" fill="#0e1c24" />
    {/* Jersey hook */}
    <rect x="78" y="4"  width="4" height="8" fill="#8a9aaa" />
    <rect x="66" y="10" width="28" height="3" fill="#8a9aaa" />
    {/* Jersey body (red) */}
    <rect x="54" y="22" width="52" height="46" fill="#8B1A1A" />
    {/* Sleeves */}
    <rect x="30" y="22" width="26" height="22" fill="#8B1A1A" />
    <rect x="104" y="22" width="26" height="22" fill="#8B1A1A" />
    {/* Jersey collar */}
    <rect x="68" y="22" width="24" height="5" fill="#aa2222" />
    {/* Number 23 pixels */}
    <rect x="70" y="34" width="4" height="18" fill="white" opacity="0.85" />
    <rect x="70" y="34" width="12" height="5"  fill="white" opacity="0.85" />
    <rect x="70" y="42" width="12" height="4"  fill="white" opacity="0.85" />
    <rect x="74" y="46" width="8"  height="6"  fill="white" opacity="0.85" />
    {/* Shelf */}
    <rect x="8" y="88" width="144" height="4" fill="#0e1c24" />
    {/* Water bottle */}
    <rect x="12" y="68" width="12" height="22" fill="#3366cc" />
    <rect x="14" y="64" width="8"  height="6"  fill="#2244aa" />
    <rect x="15" y="62" width="6"  height="4"  fill="#88aaff" />
    {/* Protein bar */}
    <rect x="32" y="74" width="24" height="14" fill="#cc7722" />
    <rect x="32" y="74" width="24" height="5"  fill="#ffaa44" />
    {/* Towel */}
    <rect x="64" y="74" width="30" height="16" fill="#cccccc" />
    <rect x="64" y="74" width="30" height="5"  fill="#cc2222" />
    {/* Left sneaker */}
    <rect x="10"  y="102" width="46" height="16" fill="#222244" />
    <rect x="12"  y="108" width="36" height="10" fill="#3333aa" />
    <rect x="8"   y="115" width="50" height="6"  fill="#eeeeee" />
    <rect x="8"   y="118" width="50" height="3"  fill="#cccccc" />
    {/* Right sneaker */}
    <rect x="102" y="102" width="46" height="16" fill="#222244" />
    <rect x="104" y="108" width="36" height="10" fill="#3333aa" />
    <rect x="100" y="115" width="50" height="6"  fill="#eeeeee" />
    <rect x="100" y="118" width="50" height="3"  fill="#cccccc" />
    {/* Clock icon on wall */}
    <rect x="120" y="30" width="24" height="24" fill="#0e1c24" />
    <rect x="121" y="31" width="22" height="22" fill="none"
      stroke="#8a9aaa" strokeWidth="2" />
    <rect x="131" y="33" width="2" height="8" fill="#ffcc00" />
    <rect x="131" y="39" width="6" height="2" fill="#ffcc00" />
  </svg>
)

const CompareInterior = () => (
  <svg viewBox="0 0 160 148" width="160" height="148"
    style={{ imageRendering: 'pixelated', display: 'block' }} aria-hidden="true">
    <rect width="160" height="148" fill="#1a2a34" />
    <rect x="0" y="10" width="160" height="4" fill="#0e1c24" />
    {/* Two hooks */}
    <rect x="38" y="4" width="4" height="8" fill="#8a9aaa" />
    <rect x="26" y="10" width="28" height="3" fill="#8a9aaa" />
    <rect x="118" y="4" width="4" height="8" fill="#8a9aaa" />
    <rect x="106" y="10" width="28" height="3" fill="#8a9aaa" />
    {/* Left jersey (red) */}
    <rect x="14" y="22" width="40" height="40" fill="#cc2222" />
    <rect x="6"  y="22" width="10" height="18" fill="#cc2222" />
    <rect x="54" y="22" width="10" height="18" fill="#cc2222" />
    <rect x="26" y="28" width="16" height="14" fill="#aa1111" />
    {/* Left number */}
    <rect x="27" y="30" width="4" height="10" fill="white" opacity="0.85" />
    <rect x="27" y="30" width="10" height="3"  fill="white" opacity="0.85" />
    <rect x="27" y="37" width="10" height="3"  fill="white" opacity="0.85" />
    <rect x="31" y="37" width="6"  height="4"  fill="white" opacity="0.85" />
    {/* Right jersey (blue) */}
    <rect x="106" y="22" width="40" height="40" fill="#2244cc" />
    <rect x="98"  y="22" width="10" height="18" fill="#2244cc" />
    <rect x="146" y="22" width="10" height="18" fill="#2244cc" />
    <rect x="118" y="28" width="16" height="14" fill="#1133aa" />
    {/* Right number */}
    <rect x="120" y="30" width="12" height="3" fill="white" opacity="0.85" />
    <rect x="120" y="33" width="4"  height="7" fill="white" opacity="0.85" />
    <rect x="120" y="40" width="12" height="3" fill="white" opacity="0.85" />
    <rect x="128" y="33" width="4"  height="7" fill="white" opacity="0.85" />
    {/* Basketball center */}
    <rect x="72" y="30" width="16" height="16" fill="#e67722" />
    <rect x="73" y="30" width="14" height="3"  fill="#cc5500" />
    <rect x="73" y="43" width="14" height="3"  fill="#cc5500" />
    <rect x="79" y="31" width="2"  height="14" fill="#cc5500" />
    {/* VS text area */}
    <rect x="68" y="50" width="24" height="14" fill="#0e1c24" />
    {/* Shelf */}
    <rect x="8" y="80" width="144" height="4" fill="#0e1c24" />
    {/* Headband on shelf */}
    <rect x="16" y="62" width="40" height="14" fill="#ffcc00" />
    <rect x="16" y="65" width="40" height="5"  fill="#cc9900" />
    {/* Water bottles */}
    <rect x="68" y="60" width="10" height="22" fill="#3366cc" />
    <rect x="82" y="60" width="10" height="22" fill="#cc3333" />
    {/* Sneakers */}
    <rect x="10"  y="94"  width="46" height="16" fill="#333" />
    <rect x="8"   y="107" width="50" height="6"  fill="#cc2222" />
    <rect x="102" y="94"  width="46" height="16" fill="#333" />
    <rect x="100" y="107" width="50" height="6"  fill="#2244cc" />
    {/* Extra item: whistle */}
    <rect x="108" y="62" width="32" height="14" fill="#aa7700" />
    <rect x="136" y="62" width="6"  height="6"  fill="#cc9900" />
  </svg>
)

const SimulatorInterior = () => (
  <svg viewBox="0 0 160 148" width="160" height="148"
    style={{ imageRendering: 'pixelated', display: 'block' }} aria-hidden="true">
    <rect width="160" height="148" fill="#1a2a34" />
    <rect x="0" y="10" width="160" height="4" fill="#0e1c24" />
    {/* Hook */}
    <rect x="78" y="4"  width="4" height="8" fill="#8a9aaa" />
    <rect x="66" y="10" width="28" height="3" fill="#8a9aaa" />
    {/* Jersey (purple) with question mark */}
    <rect x="54" y="22" width="52" height="46" fill="#5522aa" />
    <rect x="30" y="22" width="26" height="22" fill="#5522aa" />
    <rect x="104" y="22" width="26" height="22" fill="#5522aa" />
    <rect x="68" y="22" width="24" height="5" fill="#6633bb" />
    {/* ? mark */}
    <rect x="74" y="32" width="12" height="4"  fill="white" opacity="0.9" />
    <rect x="82" y="36" width="4"  height="6"  fill="white" opacity="0.9" />
    <rect x="76" y="42" width="8"  height="4"  fill="white" opacity="0.9" />
    <rect x="78" y="50" width="4"  height="4"  fill="white" opacity="0.9" />
    {/* Shelf */}
    <rect x="8" y="88" width="144" height="4" fill="#0e1c24" />
    {/* Trophy */}
    <rect x="16" y="60" width="30" height="28" fill="#ffcc00" />
    <rect x="10" y="62" width="8"  height="20" fill="#ffcc00" />
    <rect x="46" y="62" width="8"  height="20" fill="#ffcc00" />
    <rect x="18" y="62" width="26" height="22" fill="#cc9900" />
    {/* Star in trophy */}
    <rect x="27" y="68" width="8"  height="8"  fill="#ffe566" />
    <rect x="24" y="71" width="14" height="2"  fill="#ffe566" />
    {/* Stem + base */}
    <rect x="28" y="88" width="8"  height="6"  fill="#cc9900" />
    <rect x="22" y="93" width="20" height="4"  fill="#aa7700" />
    {/* Notepad / clipboard */}
    <rect x="62" y="56" width="36" height="46" fill="#eeeeee" />
    <rect x="62" y="56" width="36" height="6"  fill="#cc2222" />
    <rect x="76" y="53" width="8"  height="6"  fill="#aaaaaa" />
    {/* Lines on notepad */}
    <rect x="66" y="68" width="28" height="2" fill="#cccccc" />
    <rect x="66" y="74" width="28" height="2" fill="#cccccc" />
    <rect x="66" y="80" width="20" height="2" fill="#cccccc" />
    <rect x="66" y="86" width="24" height="2" fill="#cccccc" />
    {/* Water bottle */}
    <rect x="110" y="64" width="12" height="26" fill="#3366cc" />
    <rect x="112" y="60" width="8"  height="6"  fill="#2244aa" />
    {/* Sneakers */}
    <rect x="10"  y="102" width="46" height="16" fill="#333355" />
    <rect x="8"   y="115" width="50" height="6"  fill="#5522aa" />
    <rect x="102" y="102" width="46" height="16" fill="#333355" />
    <rect x="100" y="115" width="50" height="6"  fill="#5522aa" />
  </svg>
)

// ── Locker badge icons ─────────────────────────────────────────

const BadgeClock = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none"
    style={{ imageRendering: 'pixelated', display: 'block' }}>
    {/* Clock face */}
    <rect x="6"  y="6"  width="48" height="48" fill="none" stroke="#ffcc00" strokeWidth="4" />
    {/* Tick marks */}
    <rect x="28" y="8"  width="4" height="6"  fill="#cc9900" />
    <rect x="28" y="46" width="4" height="6"  fill="#cc9900" />
    <rect x="8"  y="28" width="6" height="4"  fill="#cc9900" />
    <rect x="46" y="28" width="6" height="4"  fill="#cc9900" />
    {/* Hour hand (pointing up) */}
    <rect x="28" y="14" width="4" height="16" fill="#ffcc00" />
    {/* Minute hand (pointing right) */}
    <rect x="30" y="28" width="14" height="4" fill="#ffcc00" />
    {/* Center pin */}
    <rect x="27" y="27" width="6" height="6"  fill="#ffffff" />
  </svg>
)

const BadgePlayers = () => (
  <svg width="64" height="60" viewBox="0 0 64 60" fill="none"
    style={{ imageRendering: 'pixelated', display: 'block' }}>
    {/* Left player — red jersey, facing right */}
    <rect x="4"  y="2"  width="10" height="10" fill="#f4c2a1" />
    <rect x="4"  y="2"  width="10" height="3"  fill="#3a2010" />
    <rect x="2"  y="12" width="14" height="14" fill="#cc2222" />
    <rect x="5"  y="15" width="8"  height="8"  fill="#aa1111" />
    {/* Right arm stretched toward ball */}
    <rect x="16" y="15" width="8"  height="4"  fill="#f4c2a1" />
    {/* Left arm */}
    <rect x="-2" y="15" width="5"  height="4"  fill="#f4c2a1" />
    {/* Legs */}
    <rect x="3"  y="26" width="5"  height="12" fill="#1a2a6a" />
    <rect x="10" y="26" width="5"  height="12" fill="#1a2a6a" />
    {/* Shoes */}
    <rect x="2"  y="37" width="7"  height="4"  fill="#222" />
    <rect x="9"  y="37" width="7"  height="4"  fill="#222" />

    {/* Basketball */}
    <rect x="26" y="18" width="12" height="12" fill="#e67722" />
    <rect x="27" y="18" width="10" height="2"  fill="#cc5500" />
    <rect x="27" y="28" width="10" height="2"  fill="#cc5500" />
    <rect x="31" y="19" width="2"  height="10" fill="#cc5500" />

    {/* Right player — blue jersey, facing left */}
    <rect x="50" y="2"  width="10" height="10" fill="#c8965a" />
    <rect x="50" y="2"  width="10" height="3"  fill="#1a0a00" />
    <rect x="48" y="12" width="14" height="14" fill="#2244cc" />
    <rect x="51" y="15" width="8"  height="8"  fill="#1133aa" />
    {/* Left arm stretched toward ball */}
    <rect x="40" y="15" width="8"  height="4"  fill="#c8965a" />
    {/* Right arm */}
    <rect x="61" y="15" width="5"  height="4"  fill="#c8965a" />
    {/* Legs */}
    <rect x="49" y="26" width="5"  height="12" fill="#1a2a6a" />
    <rect x="56" y="26" width="5"  height="12" fill="#1a2a6a" />
    {/* Shoes */}
    <rect x="48" y="37" width="7"  height="4"  fill="#222" />
    <rect x="55" y="37" width="7"  height="4"  fill="#222" />
  </svg>
)

const BadgeThoughtTrophy = () => (
  <svg width="64" height="60" viewBox="0 0 64 60" fill="none"
    style={{ imageRendering: 'pixelated', display: 'block' }}>
    {/* Thought dots — bottom-left to bubble */}
    <rect x="4"  y="52" width="5" height="5" fill="rgba(255,255,255,0.55)" />
    <rect x="10" y="44" width="7" height="7" fill="rgba(255,255,255,0.65)" />
    <rect x="18" y="36" width="8" height="8" fill="rgba(255,255,255,0.75)" />
    {/* Bubble — blocky pixel cloud */}
    <rect x="18" y="2"  width="44" height="34" fill="rgba(255,255,255,0.93)" />
    <rect x="14" y="6"  width="48" height="26" fill="rgba(255,255,255,0.93)" />
    <rect x="16" y="4"  width="46" height="30" fill="rgba(255,255,255,0.93)" />
    {/* Trophy cup */}
    <rect x="28" y="7"  width="20" height="14" fill="#ffcc00" />
    <rect x="24" y="9"  width="6"  height="10" fill="#ffcc00" />
    <rect x="48" y="9"  width="6"  height="10" fill="#ffcc00" />
    <rect x="30" y="9"  width="16" height="10" fill="#cc9900" />
    {/* Star highlight in cup */}
    <rect x="36" y="11" width="4" height="4"  fill="#ffe566" />
    <rect x="33" y="13" width="10" height="2" fill="#ffe566" />
    {/* Stem */}
    <rect x="36" y="21" width="4" height="6"  fill="#cc9900" />
    {/* Base */}
    <rect x="30" y="27" width="16" height="3" fill="#cc9900" />
    <rect x="28" y="30" width="20" height="2" fill="#aa7700" />
  </svg>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getCurrentSeason()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const qualified = data?.predictions?.filter(p => p.mvp_prob_adjusted >= 0.001) ?? []

  const lockers = [
    {
      title: 'HISTORICAL EXPLORER',
      sublabel: '1985 – 2025',
      interior: <HistoricalInterior />,
      badge: <BadgeClock />,
      path: '/historical',
    },
    {
      title: 'PLAYER COMPARISON',
      sublabel: 'HEAD-TO-HEAD',
      interior: <CompareInterior />,
      badge: <BadgePlayers />,
      path: '/compare',
    },
    {
      title: 'WHAT-IF SIMULATOR',
      sublabel: 'TWEAK STATS',
      interior: <SimulatorInterior />,
      badge: <BadgeThoughtTrophy />,
      path: '/simulator',
    },
  ]

  return (
    <div className="page">
      <header className="scoreboard">
        <span className="scoreboard-title">NBA MVP PREDICTOR</span>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat">SEASON: <span>2025-26</span></span>
          <span className="scoreboard-stat">MODEL: <span>RANDOM FOREST</span></span>
          <span className="scoreboard-stat">SEASONS: <span>1985–2025</span></span>
        </div>
      </header>

      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-inner">
          ★ NBA MVP PREDICTOR ★ POWERED BY MACHINE LEARNING ★ 42 SEASONS OF DATA ★
          RANDOM FOREST CLASSIFIER ★ STATS: WS · PER · BPM · VORP · PPG · AST ★
          PREDICTIONS UPDATED MANUALLY ★ NOT AFFILIATED WITH THE NBA ★
        </div>
      </div>

      <div className="page-inner" style={{ paddingTop: '24px' }}>

        {/* Basketball court hero */}
        <div className="court-wrapper">
          <CourtSVG />

          <div className="leaderboard-overlay">
            <div className="leaderboard-box">
              <div className="leaderboard-title">
                ★ LATEST MVP PROBABILITY — 2025-26 ★
              </div>

              {loading && (
                <div className="loading-screen" style={{ minHeight: '160px' }}>
                  <PixelBasketball />
                  <span className="loading-text">LOADING...</span>
                </div>
              )}

              {error && (
                <div className="error-screen" style={{ padding: '20px' }}>
                  <div className="error-code" style={{ fontSize: '16px' }}>ERROR</div>
                  <p className="error-msg">
                    COULD NOT CONNECT TO API.<br />
                    MAKE SURE THE BACKEND IS RUNNING.
                  </p>
                </div>
              )}

              {/* Mid-season: no players have hit 65 games yet */}
              {data && qualified.length === 0 && (
                <div className="no-data-screen">
                  <div className="no-data-title">
                    ⏳ SEASON IN PROGRESS
                  </div>
                  <div className="no-data-body">
                    NO PLAYERS HAVE REACHED THE<br />
                    65-GAME ELIGIBILITY THRESHOLD YET.<br />
                    <br />
                    CHECK BACK LATER IN THE SEASON.
                  </div>
                </div>
              )}

              {qualified.length > 0 && (
                <>
                  {qualified.slice(0, 10).map((p, i) => (
                    <div key={p.name} className="player-row fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}>
                      <span className="player-rank">#{p.rank}</span>
                      <span className="player-name">
                        {p.name}
                        {data.fatigue_players?.includes(p.name) && (
                          <span title="Voter fatigue discount applied" style={{ marginLeft: 6 }}>
                            <span className="fatigue-dot" />
                          </span>
                        )}
                      </span>
                      <span className="player-team">{p.team}</span>
                      <PixelBar value={p.mvp_prob_adjusted} />
                    </div>
                  ))}

                  {data.fatigue_players?.length > 0 && (
                    <div className="fatigue-notice" style={{ marginTop: 12 }}>
                      <span className="fatigue-dot" />
                      VOTER FATIGUE DISCOUNT APPLIED TO:{' '}
                      {data.fatigue_players.join(' · ')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Locker navigation */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span className="section-title" style={{ justifyContent: 'center', border: 'none' }}>
            SELECT A FEATURE
          </span>
        </div>

        <div className="locker-room">
          {lockers.map(l => (
            <Locker
              key={l.path}
              title={l.title}
              sublabel={l.sublabel}
              interior={l.interior}
              badge={l.badge}
              onClick={() => navigate(l.path)}
            />
          ))}
        </div>
      </div>

      <footer className="footer">
        NBA MVP PREDICTOR · DATA FROM BASKETBALL REFERENCE · NOT AFFILIATED WITH THE NBA
        <br />
        STATS: WS · PER · BPM · VORP · PPG · AST · TEAM WINS
      </footer>
    </div>
  )
}
