import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPlayer } from '../api'
import RobloxProfileButton from '../components/RobloxProfileButton'
import MalformedIndicator from '../components/MalformedIndicator'
import { formatDuration, formatKd, formatTimestamp, rankClass } from '../utils'

function StatBox({ label, value, highlight, sub }) {
  return (
    <div className={`profile-stat-box ${highlight || ''}`}>
      <div className="profile-stat-value">{value}</div>
      <div className="profile-stat-label">{label}</div>
      {sub && <div className="profile-stat-sub">{sub}</div>}
    </div>
  )
}

function QuickStat({ label, value, variant }) {
  return (
    <div className={`profile-quick-stat profile-quick-stat--${variant}`}>
      <span className="profile-quick-stat-value">{value}</span>
      <span className="profile-quick-stat-label">{label}</span>
    </div>
  )
}

function KnifeSplit({ throwKills, slashKills }) {
  const total = throwKills + slashKills
  const throwPct = total > 0 ? Math.round((throwKills / total) * 100) : 50
  const slashPct = total > 0 ? 100 - throwPct : 50

  return (
    <div className="profile-split">
      <div className="profile-split-header">
        <span>Throw {throwKills.toLocaleString()}</span>
        <span className="profile-split-title">Kill Style</span>
        <span>Slash {slashKills.toLocaleString()}</span>
      </div>
      <div className="profile-split-bar">
        <div className="profile-split-throw" style={{ width: `${throwPct}%` }} />
        <div className="profile-split-slash" style={{ width: `${slashPct}%` }} />
      </div>
      <div className="profile-split-footer">
        <span>{throwPct}% throws</span>
        <span>{slashPct}% slashes</span>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="profile-card profile-card--loading">
      <div className="profile-hero">
        <div className="profile-hero-banner skeleton-shimmer" />
        <div className="profile-hero-body">
          <div className="profile-avatar-wrap skeleton-shimmer" />
          <div className="profile-hero-text">
            <div className="skeleton-line skeleton-line--lg skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line skeleton-line--sm skeleton-shimmer" />
          </div>
        </div>
      </div>
      <div className="profile-quick-stats">
        {[1, 2, 3].map((n) => (
          <div key={n} className="profile-quick-stat skeleton-shimmer" />
        ))}
      </div>
    </div>
  )
}

function StatSection({ title, accent, children }) {
  return (
    <section className={`profile-section profile-section--${accent}`}>
      <h3 className="profile-section-title">{title}</h3>
      {children}
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
  }, []) // only on first load

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
      <div className="profile-page-header">
        <div>
          <h1>Player Profile</h1>
          <p className="page-desc">
            Search by Roblox username. Stats load live from PlayerStore.
          </p>
        </div>
      </div>

      <form className="search-form profile-search" onSubmit={handleSubmit}>
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

      {loading && <ProfileSkeleton />}

      {!loading && !player && !error && (
        <div className="profile-empty">
          <div className="profile-empty-icon">◈</div>
          <p>Search a player to view their full stat card.</p>
        </div>
      )}

      {!loading && player && (
        <div className={`profile-card ${player.malformed ? 'profile-card--malformed' : ''}`}>
          {player.malformed && <MalformedIndicator variant="banner" />}
          <div className="profile-hero">
            <div className="profile-hero-banner" />
            <div className="profile-hero-body">
              <div className="profile-avatar-wrap">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar profile-avatar--placeholder" />
                )}
              </div>
              <div className="profile-hero-text">
                <p className="profile-eyebrow">BoxSlash Operative</p>
                <div className="profile-rank-row">
                  <span className={`profile-rank-badge profile-rank-badge--${rankClass(player.rank)}`}>
                    {player.rank || 'Unranked'}
                  </span>
                  {(player.highest_rank && player.highest_rank !== player.rank) && (
                    <span className="profile-peak-rank">Peak: {player.highest_rank}</span>
                  )}
                </div>
                <h2 className="profile-display-name">{player.display_name}</h2>
                <p className="profile-username">@{player.username}</p>
                {player.malformed && <MalformedIndicator />}
                <div className="profile-actions">
                  <RobloxProfileButton userId={player.roblox_user_id} />
                  <Link to="/leaderboard" className="btn btn-secondary">Leaderboard</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-quick-stats profile-quick-stats--4">
            <QuickStat label="Kills" value={player.kills.toLocaleString()} variant="kills" />
            <QuickStat label="Deaths" value={player.deaths.toLocaleString()} variant="deaths" />
            <QuickStat label="K/D Ratio" value={kd} variant="kd" />
            <QuickStat label="Elo" value={(player.elo ?? 0).toLocaleString()} variant="elo" />
          </div>

          <div className="profile-sections">
            <StatSection title="Competitive" accent="competitive">
              <div className="profile-stat-grid profile-stat-grid--4">
                <StatBox label="Elo" value={(player.elo ?? 0).toLocaleString()} highlight="highlight-elo" />
                <StatBox label="Rank" value={player.rank || 'Unranked'} highlight="highlight-rank" />
                <StatBox label="Highest Rank" value={player.highest_rank || 'Unranked'} />
                <StatBox label="Matches Played" value={(player.matches_played ?? 0).toLocaleString()} />
              </div>
            </StatSection>

            <StatSection title="Knife Stats" accent="knife">
              <div className="profile-stat-grid">
                <StatBox label="Throw Kills" value={throwKills.toLocaleString()} />
                <StatBox label="Slash Kills" value={slashKills.toLocaleString()} />
                <StatBox label="Throw Hits" value={(player.throw_hits ?? 0).toLocaleString()} />
                <StatBox label="Slash Hits" value={(player.slash_hits ?? 0).toLocaleString()} />
                <StatBox label="Longest Streak" value={(player.longest_streak ?? 0).toLocaleString()} />
                <StatBox label="MVPs" value={(player.mvps ?? 0).toLocaleString()} />
              </div>
              <KnifeSplit throwKills={throwKills} slashKills={slashKills} />
            </StatSection>

            <StatSection title="Aerial Combat" accent="air">
              <div className="profile-stat-grid profile-stat-grid--3">
                <StatBox label="Air Kills" value={(player.air_kills ?? 0).toLocaleString()} highlight="highlight-air" />
                <StatBox
                  label="Avg Air Time"
                  value={`${player.avg_air_time ?? 0}s`}
                  sub="seconds in air"
                />
                <StatBox label="Air Kill Rate" value={`${airKillRate}%`} highlight="highlight-air" />
              </div>
              <div className="profile-meter">
                <div className="profile-meter-header">
                  <span>Air kill efficiency</span>
                  <span>{airKillRate}%</span>
                </div>
                <div className="profile-meter-track">
                  <div
                    className="profile-meter-fill profile-meter-fill--air"
                    style={{ width: `${Math.min(airKillRate, 100)}%` }}
                  />
                </div>
              </div>
            </StatSection>

            <StatSection title="Career" accent="career">
              <div className="profile-stat-grid profile-stat-grid--4">
                <StatBox label="Style Points" value={(player.style_points ?? 0).toLocaleString()} />
                <StatBox label="Cash" value={(player.cash ?? 0).toLocaleString()} />
                <StatBox
                  label="Playtime"
                  value={`${player.playtime_hours ?? 0}h`}
                  sub="total hours"
                />
                <StatBox
                  label="Total Time"
                  value={formatDuration(player.playtime_seconds ?? 0)}
                  sub="played"
                />
              </div>
              {gamepasses.length > 0 && (
                <div className="profile-gamepasses">
                  <p className="profile-gamepasses-label">Owned Gamepasses</p>
                  <div className="profile-gamepass-list">
                    {gamepasses.map((pass) => (
                      <span key={pass} className="profile-gamepass-chip">{pass}</span>
                    ))}
                  </div>
                </div>
              )}
            </StatSection>

            {hasActivity && (
              <StatSection title="Recent Activity" accent="activity">
                <div className="profile-stat-grid profile-stat-grid--2">
                  <StatBox label="Last Joined" value={formatTimestamp(player.last_joined)} />
                  <StatBox label="Last Disconnected" value={formatTimestamp(player.last_disconnected)} />
                  <StatBox
                    label="Last Session"
                    value={formatDuration(player.last_session_duration_seconds)}
                    sub="duration"
                  />
                  {player.last_server_id && (
                    <StatBox label="Last Server" value={player.last_server_id} sub="job id" />
                  )}
                </div>
              </StatSection>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
