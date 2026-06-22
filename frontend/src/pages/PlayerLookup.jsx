import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPlayer } from '../api'
import RobloxProfileButton from '../components/RobloxProfileButton'
import { formatKd } from '../utils'

function StatBox({ label, value, highlight }) {
  return (
    <div className={`stat-box ${highlight || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function PlayerLookup() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [username, setUsername] = useState(searchParams.get('user') || '')
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search(name) {
    const query = (name || username).trim()
    if (!query) return

    setLoading(true)
    setError('')
    setPlayer(null)

    try {
      const data = await getPlayer(query)
      setPlayer(data)
      setSearchParams({ user: data.username })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const preset = searchParams.get('user')
    if (preset) {
      setUsername(preset)
      search(preset)
    }
  }, []) // only on first load

  function handleSubmit(e) {
    e.preventDefault()
    search()
  }

  const kd = player ? formatKd(player) : '0'

  return (
    <div className="page">
      <h1>Player Profile</h1>
      <p className="page-desc">
        Search by Roblox username. Stats load live from PlayerStore.
      </p>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {error && <p className="status error">{error}</p>}

      {player && (
        <div className="player-card">
          <div className="player-header">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="" className="avatar-large" />
            ) : (
              <div className="avatar-placeholder large" />
            )}
            <div className="player-info">
              <h2>{player.display_name}</h2>
              <p className="username-tag">@{player.username}</p>
              {player.malformed && (
                <span className="malformed-tag">MALFORMED DATA</span>
              )}
              <p className="kd-tag">K/D Ratio: {kd}</p>
              <div className="player-actions">
                <RobloxProfileButton userId={player.roblox_user_id} />
                <Link to="/leaderboard" className="btn btn-secondary">Leaderboard</Link>
              </div>
            </div>
          </div>

          <h3 className="combat-heading">Combat Stats</h3>
          <div className="stat-grid combat-grid">
            <StatBox label="Kills" value={player.kills.toLocaleString()} highlight="highlight-kills" />
            <StatBox label="Deaths" value={player.deaths.toLocaleString()} highlight="highlight-deaths" />
            <StatBox label="K/D Ratio" value={kd} highlight="highlight-kd" />
          </div>

          <h3 className="combat-heading">Knife Stats</h3>
          <div className="stat-grid">
            <StatBox label="Throw Kills" value={(player.throw_kills ?? 0).toLocaleString()} />
            <StatBox label="Slash Kills" value={(player.slash_kills ?? 0).toLocaleString()} />
            <StatBox label="Longest Streak" value={player.longest_streak ?? 0} />
            <StatBox label="MVPs" value={player.mvps ?? 0} />
          </div>

          <h3 className="combat-heading">Aerial Stats</h3>
          <div className="stat-grid">
            <StatBox label="Air Kills" value={(player.air_kills ?? 0).toLocaleString()} />
            <StatBox label="Avg Air Time (sec)" value={player.avg_air_time ?? 0} />
            <StatBox label="Air Kill Rate" value={`${player.air_kill_rate ?? 0}%`} />
          </div>
        </div>
      )}
    </div>
  )
}
