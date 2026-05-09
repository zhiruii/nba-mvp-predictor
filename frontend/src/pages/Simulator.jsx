import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSeasons, getPlayers, getRawStats, simulate } from '../api'
import PixelBasketball from '../components/PixelBasketball'
import PixelBar from '../components/PixelBar'

const SLIDERS = [
  { key: 'WS',   label: 'WIN SHARES', min: 0,   max: 22,  step: 0.1 },
  { key: 'PER',  label: 'PER',        min: 5,   max: 40,  step: 0.1 },
  { key: 'BPM',  label: 'BOX +/-',   min: -10, max: 16,  step: 0.1 },
  { key: 'VORP', label: 'VORP',       min: -2,  max: 12,  step: 0.1 },
  { key: 'PPG',  label: 'PTS/G',      min: 5,   max: 50,  step: 0.1 },
  { key: 'AST',  label: 'AST/G',      min: 0,   max: 15,  step: 0.1 },
]

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Simulator() {
  const navigate = useNavigate()

  const [seasons, setSeasons]       = useState([])
  const [year, setYear]             = useState('')
  const [players, setPlayers]       = useState([])
  const [player, setPlayer]         = useState('')
  // Local string values for each number input — lets user type freely
  const [inputValues, setInputValues] = useState({})
  const [baseStats, setBaseStats] = useState(null)
  const [isActualMvp, setIsActualMvp] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [result, setResult]       = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [error, setError]         = useState(null)

  const debouncedOverrides = useDebounce(overrides, 600)

  useEffect(() => {
    getSeasons()
      .then(d => setSeasons([...d.historical.slice().reverse(), d.current]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!year) return
    setPlayer('')
    setBaseStats(null)
    setOverrides({})
    setResult(null)
    getPlayers(Number(year)).then(d => setPlayers(d.players)).catch(() => setPlayers([]))
  }, [year])

  // Load player's base stats instantly from raw-stats endpoint (no model retraining)
  useEffect(() => {
    if (!player || !year || !players.includes(player)) return
    setBaseStats(null)
    setIsActualMvp(false)
    setOverrides({})
    setResult(null)
    getRawStats(Number(year), player).then(data => {
      setIsActualMvp(data.is_actual_mvp ?? false)
      const initial = {}
      SLIDERS.forEach(({ key }) => {
        if (data.stats?.[key] != null) initial[key] = data.stats[key]
      })
      setBaseStats(initial)
      setOverrides(initial)
    }).catch(() => {})
  }, [player, year])

  // Auto-simulate whenever overrides change (debounced)
  useEffect(() => {
    if (!player || !year || !baseStats || Object.keys(debouncedOverrides).length === 0) return
    setSimLoading(true)
    setError(null)
    simulate({ year: Number(year), player_name: player, ...debouncedOverrides })
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setSimLoading(false))
  }, [debouncedOverrides]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep input display strings in sync when overrides change externally (load/reset)
  useEffect(() => {
    if (!baseStats) return
    const vals = {}
    SLIDERS.forEach(({ key }) => {
      const v = overrides[key]
      vals[key] = v != null ? Number(v).toFixed(1) : ''
    })
    setInputValues(vals)
  }, [baseStats]) // only on player load / reset, not on every slider move

  function handleSlider(key, value) {
    const num = Number(value)
    setOverrides(prev => ({ ...prev, [key]: num }))
    setInputValues(prev => ({ ...prev, [key]: num.toFixed(1) }))
  }

  function handleInputCommit(key, rawStr, min, max) {
    const n = parseFloat(rawStr)
    if (isNaN(n)) {
      // revert display to last valid value
      setInputValues(prev => ({ ...prev, [key]: Number(overrides[key] ?? 0).toFixed(1) }))
      return
    }
    const clamped = Math.round(Math.min(max, Math.max(min, n)) * 10) / 10
    setInputValues(prev => ({ ...prev, [key]: clamped.toFixed(1) }))
    handleSlider(key, clamped)
  }

  function handleReset() {
    if (baseStats) setOverrides({ ...baseStats })
  }

  return (
    <div className="page">
      <header className="scoreboard">
        <span className="scoreboard-title">WHAT-IF SIMULATOR</span>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat">TWEAK STATS · SEE PROBABILITY</span>
        </div>
      </header>

      <div className="page-inner" style={{ paddingTop: '28px' }}>

        <button className="back-btn" onClick={() => navigate('/')}>
          ◀ BACK TO COURT
        </button>

        <div className="section-title">CONFIGURE SIMULATION</div>

        <div className="controls-row">
          {/* Season */}
          <div className="control-group">
            <label className="control-label" htmlFor="sim-season">SEASON</label>
            <select
              id="sim-season"
              className="pixel-select"
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option value="">-- YEAR --</option>
              {seasons.map(s => (
                <option key={s} value={s}>
                  {s === 2026 ? '2025-26 (CURRENT)' : `${s - 1}–${String(s).slice(2)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Player */}
          <div className="control-group">
            <label className="control-label" htmlFor="sim-player">PLAYER</label>
            <input
              id="sim-player"
              list="sim-players-list"
              className="pixel-input"
              style={{ minWidth: '240px' }}
              placeholder="TYPE NAME..."
              value={player}
              onChange={e => setPlayer(e.target.value)}
              disabled={!year}
            />
            <datalist id="sim-players-list">
              {players.map(pl => <option key={pl} value={pl} />)}
            </datalist>
          </div>

          {baseStats && (
            <button className="pixel-btn pixel-btn-ghost" onClick={handleReset}>
              ↺ RESET
            </button>
          )}
        </div>

        {!baseStats && player && (
          <p style={{
            fontFamily: "'Press Start 2P'", fontSize: '7px',
            color: 'var(--text-muted)', marginBottom: 16,
          }}>
            {players.includes(player)
              ? 'LOADING PLAYER STATS...'
              : 'PLAYER NOT FOUND — CHECK SPELLING AND SEASON'}
          </p>
        )}

        {baseStats && (
          <div
            className="fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 280px',
              gap: '28px',
              alignItems: 'start',
            }}
          >
            {/* Sliders */}
            <div className="pixel-panel" style={{ padding: '24px' }}>
              <div style={{
                fontFamily: "'Press Start 2P'", fontSize: '8px',
                color: 'var(--gold)', marginBottom: 20,
              }}>
                STAT OVERRIDES — {player}
              </div>

              {SLIDERS.map(({ key, label, min, max, step }) => {
                const val = overrides[key] ?? baseStats[key] ?? min
                return (
                  <div key={key} className="slider-row">
                    <span className="slider-label">{label}</span>
                    <input
                      type="range"
                      className="pixel-range"
                      min={min}
                      max={max}
                      step={step}
                      value={val}
                      onChange={e => handleSlider(key, e.target.value)}
                      aria-label={label}
                    />
                    <input
                      type="number"
                      className="slider-value slider-value-input"
                      min={min}
                      max={max}
                      step="any"
                      value={inputValues[key] ?? Number(val).toFixed(1)}
                      onChange={e =>
                        setInputValues(prev => ({ ...prev, [key]: e.target.value }))
                      }
                      onBlur={e => handleInputCommit(key, e.target.value, min, max)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                      aria-label={`${label} value`}
                    />
                  </div>
                )
              })}
            </div>

            {/* Result panel */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div className="section-title" style={{ marginBottom: 16 }}>RESULT</div>

              {simLoading && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <PixelBasketball />
                  <div className="loading-text" style={{ marginTop: 12, fontSize: '7px' }}>
                    SIMULATING...
                  </div>
                </div>
              )}

              {error && (
                <p style={{
                  fontFamily: "'Press Start 2P'", fontSize: '7px',
                  color: 'var(--red)', lineHeight: 2,
                }}>
                  ⚠ {error}
                </p>
              )}

              {result && !simLoading && (
                <>
                  {isActualMvp && (
                    <div className="crown-badge" style={{ marginBottom: 12, fontSize: '8px', display: 'flex', justifyContent: 'center' }}>
                      ★ ACTUAL MVP THIS SEASON
                    </div>
                  )}
                  <div className="prob-result">
                    <div className="prob-result-label">MVP PROBABILITY</div>
                    <div className="prob-result-value">
                      {(result.mvp_prob_adjusted * 100).toFixed(1)}%
                    </div>
                    <div className="prob-result-rank">
                      PROJECTED RANK #{result.rank}
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <PixelBar value={result.mvp_prob_adjusted} />
                  </div>

                  <div style={{
                    fontFamily: "'Press Start 2P'", fontSize: '6px',
                    color: 'var(--text-muted)', marginTop: 16, lineHeight: 2.2,
                  }}>
                    ★ SLIDERS UPDATE AUTOMATICALLY
                    <br />
                    ★ TEAM WINS RECALCULATED
                    <br />
                    ★ FATIGUE DISCOUNT APPLIED
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        NBA MVP PREDICTOR · WHAT-IF SIMULATOR · RESULTS ARE MODEL ESTIMATES ONLY
      </footer>
    </div>
  )
}
