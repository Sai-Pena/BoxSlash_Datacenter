const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request failed (${response.status})`)
  }
  return response.json()
}

async function apiPost(path) {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST' })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request failed (${response.status})`)
  }
  return response.json()
}

export function getLeaderboard() {
  return apiGet('/api/leaderboard')
}

export function getPlayer(username) {
  return apiGet(`/api/players/${encodeURIComponent(username)}`)
}

export function getAllPlayers() {
  return apiGet('/api/players')
}

export function syncPlayer(username) {
  return apiPost(`/api/sync/${encodeURIComponent(username)}`)
}

export function syncAllPlayers() {
  return apiPost('/api/sync')
}
