// Local dev: empty string uses Vite proxy (vite.config.js → port 8002)
// Production (Vercel): set VITE_API_URL to your Render URL at build time (no trailing slash)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function backendError(caught) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  if (isLocal) {
    return (
      'Cannot reach the backend. Start it in a terminal:\n\n' +
      'cd ~/dev/BoxSlash_Datacenter/backend\n' +
      './venv/Scripts/uvicorn main:app --reload --host 127.0.0.1 --port 8002\n\n' +
      'Also make sure the frontend is running: npm run dev'
    )
  }

  if (!API_BASE) {
    return (
      'VITE_API_URL is not set on Vercel.\n\n' +
      'Go to Vercel → Project → Settings → Environment Variables\n' +
      'Add: VITE_API_URL = https://your-app.onrender.com\n' +
      'Then redeploy (env vars only apply after a new build).'
    )
  }

  return (
    `Cannot reach the backend at ${API_BASE}.\n\n` +
    'Check:\n' +
    '1. Render service is running (open the URL in your browser)\n' +
    '2. On Render, ALLOWED_ORIGINS includes your Vercel URL\n' +
    '   e.g. https://your-site.vercel.app\n' +
    '3. Redeploy Render after changing ALLOWED_ORIGINS'
  )
}

async function apiGet(path) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`)
  } catch {
    throw new Error(backendError())
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request failed (${response.status})`)
  }
  return response.json()
}

export function getLeaderboard({ profiles = true } = {}) {
  const params = profiles ? '' : '?profiles=false'
  return apiGet(`/api/leaderboard${params}`)
}

export function getLeaderboardProfiles(userIds) {
  if (!userIds.length) {
    return Promise.resolve({ profiles: {} })
  }
  const ids = userIds.join(',')
  return apiGet(`/api/leaderboard/profiles?ids=${encodeURIComponent(ids)}`)
}

export function getPlayer(username) {
  return apiGet(`/api/players/${encodeURIComponent(username)}`)
}
