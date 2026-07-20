import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPlayer } from '../api'
import LoadingMark from '../components/LoadingMark'
import MalformedIndicator from '../components/MalformedIndicator'
import RobloxProfileButton from '../components/RobloxProfileButton'
import { formatDuration, formatKd, formatTimestamp } from '../utils'

function StatRow({ label, value, sub }) {
  return (
    <div className="stat-row">
      <span className="stat-row-label">{label}</span>
      <span className="stat-row-value">
        {value}
        {sub && <span className="stat-row-sub"> {sub}</span>}
      </span>
    </div>
  )
}

function StatSection({ title, children }) {
  return (
    <section className="profile-section">
      <h3 className="profile-section-title">{title}</h3>
      <div className="stat-rows">{children}</div>
    </section>
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
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    search()
  }

  const kd = player ? formatKd(player) : '0'
  const throwKills = player?.throw_kills ?? 0
  const slashKills = player?.slash_kills ?? 0
  const airKillRate = player?.air_kill_rate ?? 0
  const hasActivity = player && (
    player.last_joined
    || player.last_disconnected
    || player.last_session_duration_seconds != null
    || player.last_server_id
  )
  const gamepasses = player?.owned_gamepasses ?? []

  return (
    <div className="page profile-page">
      <h1>Player Profile</h1>
      <p className="page-desc">Search by Roblox username.</p>

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
      {loading && <LoadingMark label="Loading profile" />}

      {!loading && !player && !error && (
        <p className="empty-hint">Search a player to view their stats.</p>
      )}

      {!loading && player && (
        <div className={`profile-sheet ${player.malformed ? 'profile-sheet--malformed' : ''}`}>
          {player.malformed && <MalformedIndicator variant="banner" />}

          <header className="profile-head">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar--placeholder" />
            )}
            <div className="profile-head-text">
              <p className="profile-rank-line">
                {player.rank || 'Unranked'}
                {player.highest_rank && player.highest_rank !== player.rank && (
                  <span className="profile-peak"> · peak {player.highest_rank}</span>
                )}
              </p>
              <h2 className="profile-display-name">{player.display_name}</h2>
              <p className="profile-username">@{player.username}</p>
              {player.malformed && <MalformedIndicator />}
              <div className="profile-actions">
                <RobloxProfileButton userId={player.roblox_user_id} />
                <Link to="/leaderboard" className="btn btn-secondary">Leaderboard</Link>
              </div>
            </div>
          </header>

          <div className="profile-summary">
            <div className="profile-summary-item">
              <span className="profile-summary-value">{player.kills.toLocaleString()}</span>
              <span className="profile-summary-label">Kills</span>
            </div>
            <div className="profile-summary-item">
              <span className="profile-summary-value">{player.deaths.toLocaleString()}</span>
              <span className="profile-summary-label">Deaths</span>
            </div>
            <div className="profile-summary-item">
              <span className="profile-summary-value">{kd}</span>
              <span className="profile-summary-label">K/D</span>
            </div>
            <div className="profile-summary-item">
              <span className="profile-summary-value">{(player.elo ?? 0).toLocaleString()}</span>
              <span className="profile-summary-label">Elo</span>
            </div>
          </div>

          <StatSection title="Competitive">
            <StatRow label="Elo" value={(player.elo ?? 0).toLocaleString()} />
            <StatRow label="Rank" value={player.rank || 'Unranked'} />
            <StatRow label="Highest Rank" value={player.highest_rank || 'Unranked'} />
            <StatRow label="Matches Played" value={(player.matches_played ?? 0).toLocaleString()} />
          </StatSection>

          <StatSection title="Knife">
            <StatRow label="Throw Kills" value={throwKills.toLocaleString()} />
            <StatRow label="Slash Kills" value={slashKills.toLocaleString()} />
            <StatRow label="Throw Hits" value={(player.throw_hits ?? 0).toLocaleString()} />
            <StatRow label="Slash Hits" value={(player.slash_hits ?? 0).toLocaleString()} />
            <StatRow label="Longest Streak" value={(player.longest_streak ?? 0).toLocaleString()} />
            <StatRow label="MVPs" value={(player.mvps ?? 0).toLocaleString()} />
          </StatSection>

          <StatSection title="Aerial">
            <StatRow label="Air Kills" value={(player.air_kills ?? 0).toLocaleString()} />
            <StatRow label="Avg Air Time" value={`${player.avg_air_time ?? 0}s`} />
            <StatRow label="Air Kill Rate" value={`${airKillRate}%`} />
          </StatSection>

          <StatSection title="Career">
            <StatRow label="Style Points" value={(player.style_points ?? 0).toLocaleString()} />
            <StatRow label="Cash" value={(player.cash ?? 0).toLocaleString()} />
            <StatRow label="Playtime" value={`${player.playtime_hours ?? 0}h`} />
            <StatRow label="Total Time" value={formatDuration(player.playtime_seconds ?? 0)} />
            {gamepasses.length > 0 && (
              <StatRow label="Gamepasses" value={gamepasses.join(', ')} />
            )}
          </StatSection>

          {hasActivity && (
            <StatSection title="Recent Activity">
              <StatRow label="Last Joined" value={formatTimestamp(player.last_joined)} />
              <StatRow label="Last Disconnected" value={formatTimestamp(player.last_disconnected)} />
              <StatRow
                label="Last Session"
                value={formatDuration(player.last_session_duration_seconds)}
              />
              {player.last_server_id && (
                <StatRow label="Last Server" value={player.last_server_id} />
              )}
            </StatSection>
          )}
        </div>
      )}
    </div>
  )
}
