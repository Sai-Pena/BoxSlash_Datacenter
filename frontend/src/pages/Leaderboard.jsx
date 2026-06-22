import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard } from '../api'
import MalformedIndicator from '../components/MalformedIndicator'
import { formatKd, robloxProfileUrl } from '../utils'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const data = await getLeaderboard()
      setRows(data.leaderboard)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1>Kill Leaderboard</h1>
          <p className="page-desc">Top 100 players ranked by kills. Click a name for full stats.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && rows.length === 0 && <p className="status">Loading leaderboard...</p>}
      {error && <p className="status error">{error}</p>}

      {!error && rows.length === 0 && !loading && (
        <p className="status">No players on the leaderboard yet. Play the game to get stats!</p>
      )}

      {rows.length > 0 && (
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
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.username}-${row.roblox_user_id}`} className={`${row.rank <= 3 ? `top-${row.rank}` : ''} ${row.malformed ? 'malformed-row' : ''}`}>
                  <td className="rank-cell">
                    {row.malformed && <MalformedIndicator variant="icon" />}
                    #{row.rank}
                  </td>
                  <td className="player-cell">
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="avatar-small" />
                    ) : (
                      <div className="avatar-placeholder" />
                    )}
                    <div className="player-name-links">
                      <Link to={`/lookup?user=${row.username}`}>{row.display_name}</Link>
                      {row.malformed && <MalformedIndicator />}
                      {row.roblox_user_id && (
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
              ))}
            </tbody>
          </table>
          {rows.some((row) => row.malformed) && (
            <p className="malformed-legend">
              <MalformedIndicator variant="icon" />
              Malformed entries have unreadable PlayerStore data — stats shown are placeholders (0/0/0).
            </p>
          )}
        </div>
      )}
    </div>
  )
}
