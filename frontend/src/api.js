// Empty string = same origin; Vite proxies /api to the backend (see vite.config.js)
const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiGet(path) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`)
  } catch {
    throw new Error(
      `Cannot reach the backend. Make sure it is running:\n` +
      'cd ~/dev/BoxSlash_Datacenter/backend\n' +
      './venv/Scripts/uvicorn main:app --reload --host 127.0.0.1 --port 8002'
    )
  }
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
