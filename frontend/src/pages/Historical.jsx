import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSeasons, getHistorical } from '../api'
import PixelBasketball from '../components/PixelBasketball'
import PixelBar from '../components/PixelBar'

const STAT_LABELS = {
  WS: 'WIN SHARES', PER: 'PER', BPM: 'BOX +/-', VORP: 'VORP',
  PPG: 'PTS/G', AST: 'AST/G', TRB: 'REB/G', G: 'GAMES',
}

export default function Historical() {
  const navigate = useNavigate()

  const [seasons, setSeasons]   = useState([])
  const [year, setYear]         = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [seasonsLoading, setSeasonsLoading] = useState(true)

  useEffect(() => {
    getSeasons()
      .then(d => setSeasons(d.historical.slice().reverse()))
      .catch(() => {})
      .finally(() => setSeasonsLoading(false))
  }, [])

  function handleLoad() {
    if (!year) return
    setLoading(true)
    setError(null)
    setResult(null)
    getHistorical(Number(year))
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="page">
      <header className="scoreboard">
        <span className="scoreboard-title">HISTORICAL EXPLORER</span>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat">SEASONS: <span>1985 – 2025</span></span>
        </div>
      </header>

      <div className="page-inner" style={{ paddingTop: '28px' }}>

        <button className="back-btn" onClick={() => navigate('/')}>
          ◀ BACK TO COURT
        </button>

        <div className="section-title">PICK A SEASON</div>

        <div className="controls-row">
          <div className="control-group">
            <label className="control-label" htmlFor="season-select">SEASON YEAR</label>
            <select
              id="season-select"
              className="pixel-select"
              value={year}
              onChange={e => setYear(e.target.value)}
              disabled={seasonsLoading}
            >
              <option value="">-- SELECT --</option>
              {seasons.map(s => (
                <option key={s} value={s}>
                  {s - 1}–{String(s).slice(2)} SEASON
                </option>
              ))}
            </select>
          </div>

          <button
            className="pixel-btn"
            onClick={handleLoad}
            disabled={!year || loading}
          >
            {loading ? 'LOADING...' : '▶ LOAD SEASON'}
          </button>
        </div>

        {error && (
          <div className="error-screen" style={{ padding: '24px 0' }}>
            <div className="error-code" style={{ fontSize: '14px' }}>ERROR</div>
            <p className="error-msg">{error}</p>
          </div>
        )}

        {loading && (
          <div className="loading-screen">
            <PixelBasketball />
            <span className="loading-text">TRAINING MODEL...</span>
            <span style={{ fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#64748b' }}>
              ~5 SECONDS
            </span>
          </div>
        )}

        {result && (
          <div className="fade-in">
            {/* Season summary badges */}
            <div className="historical-meta">
              <div className="meta-badge">
                <span className="meta-badge-label">SEASON</span>
                <span className="meta-badge-value">
                  {result.year - 1}–{String(result.year).slice(2)}
                </span>
              </div>
              <div className="meta-badge">
                <span className="meta-badge-label">ACTUAL MVP</span>
                <span className="meta-badge-value" style={{ fontSize: '20px' }}>
                  {result.actual_mvp ?? '—'}
                </span>
              </div>
              <div className="meta-badge">
                <span className="meta-badge-label">MODEL RANK</span>
                <span className="meta-badge-value" style={{
                  color: result.model_rank === 1 ? 'var(--green)' : 'var(--gold)',
                }}>
                  #{result.model_rank ?? '—'}
                </span>
              </div>
              {result.model_rank === 1 && (
                <div className="meta-badge" style={{ border: '3px solid var(--green)' }}>
                  <span className="meta-badge-label">PREDICTION</span>
                  <span className="meta-badge-value" style={{ color: 'var(--green)', fontSize: '18px' }}>
                    ✓ CORRECT
                  </span>
                </div>
              )}
            </div>

            {/* Predictions table */}
            <div className="section-title" style={{ marginTop: '4px' }}>
              TOP-15 PREDICTIONS
            </div>

            {result.fatigue_players?.length > 0 && (
              <div className="fatigue-notice" style={{ marginBottom: 16 }}>
                <span className="fatigue-dot" />
                VOTER FATIGUE DISCOUNT: {result.fatigue_players.join(' · ')}
              </div>
            )}

            {result.predictions.filter(p => p.mvp_prob_adjusted >= 0.001).map((p, i) => {
              const isActual = p.name === result.actual_mvp
              return (
                <div
                  key={p.name}
                  className="player-row fade-in"
                  style={{
                    animationDelay: `${i * 30}ms`,
                    background: isActual ? 'rgba(255,204,0,0.08)' : undefined,
                    borderLeft: isActual ? '4px solid var(--gold)' : '4px solid transparent',
                  }}
                >
                  <span className="player-rank">#{p.rank}</span>
                  <span className="player-name">
                    {p.name}
                    {isActual && (
                      <span className="crown-badge" style={{ marginLeft: 8 }}>★ MVP</span>
                    )}
                    {result.fatigue_players?.includes(p.name) && (
                      <span className="fatigue-dot" style={{ marginLeft: 8 }} title="Fatigue discount" />
                    )}
                  </span>
                  <span className="player-team">{p.team}</span>
                  <PixelBar
                    value={p.mvp_prob_adjusted}
                    color={isActual ? '#22c55e' : '#ffcc00'}
                  />
                </div>
              )
            })}

            {/* Stats for actual MVP */}
            {result.actual_mvp && (() => {
              const mvpRow = result.predictions.find(p => p.name === result.actual_mvp)
              if (!mvpRow?.stats) return null
              return (
                <>
                  <div className="section-title" style={{ marginTop: 32 }}>
                    {result.actual_mvp} — KEY STATS
                  </div>
                  <div className="stats-grid">
                    {Object.entries(STAT_LABELS).map(([key, label]) => (
                      mvpRow.stats[key] != null && (
                        <div key={key} className="stat-cell">
                          <span className="stat-cell-label">{label}</span>
                          <span className="stat-cell-value">
                            {mvpRow.stats[key]?.toFixed(1)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      <footer className="footer">
        NBA MVP PREDICTOR · HISTORICAL DATA 1985–2025 · MODEL RETRAINS PER SEASON
      </footer>
    </div>
  )
}
