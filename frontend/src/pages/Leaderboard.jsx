import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard, getLeaderboardProfiles } from '../api'
import MalformedIndicator from '../components/MalformedIndicator'
import { formatKd, robloxProfileUrl } from '../utils'

const INITIAL_ROWS = 20
const PROFILE_CHUNK = 25

function AvatarCell({ row }) {
  if (row.avatar_url) {
    return <img src={row.avatar_url} alt="" className="avatar-small" />
  }
  if (row.profiles_pending) {
    return <div className="avatar-placeholder avatar-placeholder--loading" />
  }
  return <div className="avatar-placeholder" />
}

function LeaderboardRow({ row }) {
  return (
    <tr className={`${row.rank <= 3 ? `top-${row.rank}` : ''} ${row.malformed ? 'malformed-row' : ''}`}>
      <td className="rank-cell">
        {row.malformed && <MalformedIndicator variant="icon" />}
        #{row.rank}
      </td>
      <td className="player-cell">
        <AvatarCell row={row} />
        <div className="player-name-links">
          {row.profiles_pending ? (
            <span className="player-name-pending">{row.display_name}</span>
          ) : (
            <Link to={`/lookup?user=${row.username}`}>{row.display_name}</Link>
          )}
          {row.malformed && <MalformedIndicator />}
          {row.roblox_user_id && !row.profiles_pending && (
            <a
              href={robloxProfileUrl(row.roblox_user_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="roblox-mini-link"
              title="Open Roblox profile"
            >
              Roblox ↗
            </a>
          )}
        </div>
      </td>
      <td className={`kills-cell ${row.malformed ? 'malformed-stat' : ''}`}>
        {(row.kills ?? 0).toLocaleString()}
      </td>
      <td className={`deaths-cell ${row.malformed ? 'malformed-stat' : ''}`}>
        {(row.deaths ?? 0).toLocaleString()}
      </td>
      <td className={`kd-cell ${row.malformed ? 'malformed-stat' : ''}`}>
        {formatKd(row)}
      </td>
    </tr>
  )
}

function TableSkeleton({ rows = 10 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} className="leaderboard-skeleton-row">
          <td><div className="skeleton-shimmer skeleton-cell skeleton-cell--sm" /></td>
          <td>
            <div className="player-cell">
              <div className="avatar-placeholder avatar-placeholder--loading" />
              <div className="skeleton-shimmer skeleton-cell skeleton-cell--lg" />
            </div>
          </td>
          <td><div className="skeleton-shimmer skeleton-cell" /></td>
          <td><div className="skeleton-shimmer skeleton-cell" /></td>
          <td><div className="skeleton-shimmer skeleton-cell" /></td>
        </tr>
      ))}
    </tbody>
  )
}

function mergeProfiles(rows, profileMap) {
  return rows.map((row) => {
    const profile = profileMap[String(row.roblox_user_id)]
    if (!profile) return row
    return {
      ...row,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      profiles_pending: false,
    }
  })
}

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const [error, setError] = useState('')
  const loadIdRef = useRef(0)
  const revealCleanupRef = useRef(null)

  const revealRows = useCallback((total) => {
    if (revealCleanupRef.current) {
      revealCleanupRef.current()
    }
    setVisibleCount(Math.min(INITIAL_ROWS, total))
    if (total <= INITIAL_ROWS) return

    let shown = INITIAL_ROWS
    const timers = []
    const step = () => {
      shown = Math.min(shown + 15, total)
      setVisibleCount(shown)
      if (shown < total) {
        timers.push(window.setTimeout(step, 40))
      }
    }
    timers.push(window.setTimeout(step, 60))
    revealCleanupRef.current = () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  async function enrichProfiles(currentRows, loadId) {
    const userIds = currentRows.map((row) => row.roblox_user_id).filter(Boolean)
    if (!userIds.length) return

    setProfilesLoading(true)
    try {
      for (let i = 0; i < userIds.length; i += PROFILE_CHUNK) {
        if (loadIdRef.current !== loadId) return

        const chunk = userIds.slice(i, i + PROFILE_CHUNK)
        const { profiles } = await getLeaderboardProfiles(chunk)
        if (loadIdRef.current !== loadId) return

        setRows((prev) => mergeProfiles(prev, profiles))
      }
    } catch {
      // Stats are still usable without profile enrichment.
    } finally {
      if (loadIdRef.current === loadId) {
        setProfilesLoading(false)
      }
    }
  }

  async function loadData() {
    const loadId = ++loadIdRef.current
    setStatsLoading(true)
    setProfilesLoading(false)
    setError('')
    setVisibleCount(0)

    try {
      const data = await getLeaderboard({ profiles: false })
      if (loadIdRef.current !== loadId) return

      const leaderboard = data.leaderboard ?? []
      setRows(leaderboard)
      setStatsLoading(false)
      revealRows(leaderboard.length)
      enrichProfiles(leaderboard, loadId)
    } catch (err) {
      if (loadIdRef.current !== loadId) return
      setError(err.message)
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    return () => {
      if (revealCleanupRef.current) revealCleanupRef.current()
    }
  }, [])

  const visibleRows = rows.slice(0, visibleCount || rows.length)
  const hasMalformed = rows.some((row) => row.malformed)

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1>Kill Leaderboard</h1>
          <p className="page-desc">
            Top 100 players ranked by kills.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={statsLoading}>
          {statsLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {profilesLoading && rows.length > 0 && (
        <p className="leaderboard-status">Loading player names and avatars…</p>
      )}

      {error && <p className="status error">{error}</p>}

      {!error && rows.length === 0 && !statsLoading && (
        <p className="status">No players on the leaderboard yet. Play the game to get stats!</p>
      )}

      {(statsLoading || rows.length > 0) && (
        <div className="table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Kills</th>
                <th>Deaths</th>
                <th>K/D</th>
              </tr>
            </thead>
            {statsLoading ? (
              <TableSkeleton rows={12} />
            ) : (
              <tbody>
                {visibleRows.map((row) => (
                  <LeaderboardRow key={`${row.roblox_user_id}-${row.rank}`} row={row} />
                ))}
              </tbody>
            )}
          </table>
          {hasMalformed && !statsLoading && (
            <p className="malformed-legend">
              <MalformedIndicator variant="icon" />
              Malformed entries have unreadable PlayerStore data.. stats shown are placeholders (0/0/0).
            </p>
          )}
        </div>
      )}
    </div>
  )
}
