const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiFetch(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const getSeasons      = ()            => apiFetch('/api/seasons')
export const getPlayers      = (year)        => apiFetch(`/api/players/${year}`)
export const getCurrentSeason = ()           => apiFetch('/api/current-season')
export const getHistorical   = (year)        => apiFetch(`/api/historical/${year}`)
export const comparePlayers  = (p1, p2, yr)  =>
  apiFetch(`/api/compare?player1=${encodeURIComponent(p1)}&player2=${encodeURIComponent(p2)}&year=${yr}`)
export const getRawStats     = (year, name)  =>
  apiFetch(`/api/raw-stats/${year}/${encodeURIComponent(name)}`)
export const simulate        = (body)        =>
  apiFetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
