import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSeasons, getPlayers, comparePlayers } from '../api'
import PixelBar from '../components/PixelBar'

const DISPLAY_STATS = [
  { key: 'PPG',  label: 'PTS/G'      },
  { key: 'AST',  label: 'AST/G'      },
  { key: 'TRB',  label: 'REB/G'      },
  { key: 'WS',   label: 'WIN SHARES' },
  { key: 'PER',  label: 'PER'        },
  { key: 'BPM',  label: 'BOX +/-'   },
  { key: 'VORP', label: 'VORP'       },
  { key: 'TS',   label: 'TRUE SHOOT' },
  { key: 'G',    label: 'GAMES'      },
]

export default function Compare() {
  const navigate = useNavigate()

  const [seasons, setSeasons]   = useState([])
  const [year, setYear]         = useState('')
  const [players, setPlayers]   = useState([])
  const [p1, setP1]             = useState('')
  const [p2, setP2]             = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getSeasons()
      .then(d => setSeasons([...d.historical.slice().reverse(), d.current]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!year) return
    setP1('')
    setP2('')
    setResult(null)
    getPlayers(Number(year)).then(d => setPlayers(d.players)).catch(() => setPlayers([]))
  }, [year])

  function handleCompare() {
    if (!year || !p1 || !p2 || p1 === p2) return
    setLoading(true)
    setError(null)
    setResult(null)
    comparePlayers(p1, p2, Number(year))
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  const canCompare = year && p1 && p2 && p1 !== p2

  return (
    <div className="page">
      <header className="scoreboard">
        <span className="scoreboard-title">PLAYER COMPARISON</span>
        <div className="scoreboard-stats">
          <span className="scoreboard-stat">HEAD-TO-HEAD</span>
        </div>
      </header>

      <div className="page-inner" style={{ paddingTop: '28px' }}>

        <button className="back-btn" onClick={() => navigate('/')}>
          ◀ BACK TO COURT
        </button>

        <div className="section-title">SELECT PLAYERS</div>

        <div className="controls-row">
          {/* Season */}
          <div className="control-group">
            <label className="control-label" htmlFor="cmp-season">SEASON</label>
            <select
              id="cmp-season"
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

          {/* Player 1 */}
          <div className="control-group">
            <label className="control-label" htmlFor="cmp-p1">PLAYER 1</label>
            <input
              id="cmp-p1"
              list="players-list"
              className="pixel-input"
              style={{ minWidth: '220px' }}
              placeholder="TYPE NAME..."
              value={p1}
              onChange={e => setP1(e.target.value)}
              disabled={!year}
            />
          </div>

          {/* Player 2 */}
          <div className="control-group">
            <label className="control-label" htmlFor="cmp-p2">PLAYER 2</label>
            <input
              id="cmp-p2"
              list="players-list"
              className="pixel-input"
              style={{ minWidth: '220px' }}
              placeholder="TYPE NAME..."
              value={p2}
              onChange={e => setP2(e.target.value)}
              disabled={!year}
            />
          </div>

          <datalist id="players-list">
            {players.map(pl => <option key={pl} value={pl} />)}
          </datalist>

          <button
            className="pixel-btn"
            onClick={handleCompare}
            disabled={!canCompare || loading}
          >
            {loading ? 'LOADING...' : '⚔ COMPARE'}
          </button>
        </div>

        {p1 && p2 && p1 === p2 && (
          <p style={{
            fontFamily: "'Press Start 2P'", fontSize: '8px',
            color: 'var(--red)', marginBottom: 16,
          }}>
            ⚠ SELECT TWO DIFFERENT PLAYERS
          </p>
        )}

        {error && (
          <div className="error-screen" style={{ padding: '24px 0' }}>
            <div className="error-code" style={{ fontSize: '14px' }}>ERROR</div>
            <p className="error-msg">{error}</p>
          </div>
        )}

        {loading && (
          <div className="loading-screen">
            <div className="loading-ball" />
            <span className="loading-text">LOADING...</span>
          </div>
        )}

        {result && (
          <div className="fade-in">
            <div className="compare-vs">VS</div>

            <div className="compare-grid">
              {result.players.map((pl, idx) => (
                <div key={pl.name} className="pixel-panel-gold" style={{ padding: '16px' }}>
                  <div className="compare-player-header"
                    style={{ borderColor: idx === 0 ? 'var(--gold-dk)' : '#2563eb' }}>
                    {pl.name}
                    <br />
                    <span style={{ fontSize: '7px', color: 'var(--text-muted)' }}>
                      {pl.team} · {year === '2026' ? '2025-26' : `${year - 1}–${String(year).slice(2)}`}
                    </span>
                  </div>

                  {/* MVP Probability */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      fontFamily: "'Press Start 2P'", fontSize: '7px',
                      color: 'var(--text-muted)', display: 'block', marginBottom: 8,
                    }}>
                      MVP PROBABILITY
                    </span>
                    {pl.mvp_prob_adjusted != null
                      ? <PixelBar
                          value={pl.mvp_prob_adjusted}
                          color={idx === 0 ? '#ffcc00' : '#60a5fa'}
                        />
                      : <span style={{
                          fontFamily: "'Press Start 2P'", fontSize: '7px',
                          color: 'var(--text-muted)',
                        }}>
                          DID NOT QUALIFY
                        </span>
                    }
                  </div>

                  {/* Stats grid */}
                  <div className="stats-grid">
                    {DISPLAY_STATS.map(({ key, label }) => (
                      pl.stats?.[key] != null && (
                        <div key={key} className="stat-cell">
                          <span className="stat-cell-label">{label}</span>
                          <span className="stat-cell-value"
                            style={{ color: idx === 0 ? 'var(--gold)' : 'var(--blue)' }}>
                            {pl.stats[key]?.toFixed(1)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        NBA MVP PREDICTOR · PLAYER COMPARISON · DATA FROM BASKETBALL REFERENCE
      </footer>
    </div>
  )
}
