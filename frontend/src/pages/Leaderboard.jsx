import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard } from '../api'

function formatKd(row) {
  if (row.kd_ratio != null && row.kd_ratio !== '') {
    return row.kd_ratio
  }
  if (row.deaths === 0) {
    return row.kills ?? 0
  }
  return ((row.kills ?? 0) / row.deaths).toFixed(2)
}

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLeaderboard()
      .then((data) => setRows(data.leaderboard))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="status">Loading leaderboard...</p>
  if (error) return <p className="status error">{error}</p>

  return (
    <div className="page">
      <h1>Kill Leaderboard</h1>
      <p className="page-desc">Ranked by total kills.</p>

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
              <tr key={row.username} className={row.rank <= 3 ? `top-${row.rank}` : ''}>
                <td className="rank-cell">#{row.rank}</td>
                <td className="player-cell">
                  {row.avatar_url ? (
                    <img src={row.avatar_url} alt="" className="avatar-small" />
                  ) : (
                    <div className="avatar-placeholder" />
                  )}
                  <Link to={`/lookup?user=${row.username}`}>{row.display_name}</Link>
                </td>
                <td className="kills-cell">{(row.kills ?? 0).toLocaleString()}</td>
                <td className="deaths-cell">{(row.deaths ?? 0).toLocaleString()}</td>
                <td className="kd-cell">{formatKd(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
