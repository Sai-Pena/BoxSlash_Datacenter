import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPlayer } from '../api'
import MalformedIndicator from '../components/MalformedIndicator'
import { formatDuration, formatKd } from '../utils'

const STAT_SECTIONS = [
  {
    title: 'Combat',
    stats: [
      { key: 'kills', label: 'Kills', higherBetter: true, format: 'number' },
      { key: 'deaths', label: 'Deaths', higherBetter: false, format: 'number' },
      { key: 'kd_ratio', label: 'K/D Ratio', higherBetter: true, format: 'kd' },
      { key: 'air_kills', label: 'Air Kills', higherBetter: true, format: 'number' },
      { key: 'air_kill_rate', label: 'Air Kill Rate', higherBetter: true, format: 'percent' },
      { key: 'avg_air_time', label: 'Avg Air Time', higherBetter: true, format: 'seconds' },
    ],
  },
  {
    title: 'Knife',
    stats: [
      { key: 'throw_kills', label: 'Throw Kills', higherBetter: true, format: 'number' },
      { key: 'slash_kills', label: 'Slash Kills', higherBetter: true, format: 'number' },
      { key: 'throw_hits', label: 'Throw Hits', higherBetter: true, format: 'number' },
      { key: 'slash_hits', label: 'Slash Hits', higherBetter: true, format: 'number' },
      { key: 'longest_streak', label: 'Longest Streak', higherBetter: true, format: 'number' },
      { key: 'mvps', label: 'MVPs', higherBetter: true, format: 'number' },
    ],
  },
  {
    title: 'Competitive',
    stats: [
      { key: 'elo', label: 'Elo', higherBetter: true, format: 'number' },
      { key: 'rank', label: 'Rank', format: 'text' },
      { key: 'highest_rank', label: 'Highest Rank', format: 'text' },
      { key: 'matches_played', label: 'Matches Played', higherBetter: true, format: 'number' },
    ],
  },
  {
    title: 'Career',
    stats: [
      { key: 'style_points', label: 'Style Points', higherBetter: true, format: 'number' },
      { key: 'cash', label: 'Cash', higherBetter: true, format: 'number' },
      { key: 'playtime_hours', label: 'Playtime', higherBetter: true, format: 'hours' },
    ],
  },
]

function formatStatValue(player, stat) {
  const raw = player?.[stat.key]
  switch (stat.format) {
    case 'kd':
      return formatKd(player)
    case 'percent':
      return `${raw ?? 0}%`
    case 'seconds':
      return `${raw ?? 0}s`
    case 'hours':
      return `${raw ?? 0}h`
    case 'text':
      return raw || '—'
    default:
      return (raw ?? 0).toLocaleString()
  }
}

function numericValue(player, stat) {
  if (stat.format === 'text') return null
  if (stat.format === 'kd') return Number(formatKd(player))
  return Number(player?.[stat.key] ?? 0)
}

function compareWinner(left, right, stat) {
  if (!left || !right || stat.format === 'text') return null
  const a = numericValue(left, stat)
  const b = numericValue(right, stat)
  if (a === b) return 'tie'
  const leftWins = stat.higherBetter ? a > b : a < b
  if (leftWins) return 'left'
  return 'right'
}

function countWins(left, right) {
  let leftWins = 0
  let rightWins = 0
  for (const section of STAT_SECTIONS) {
    for (const stat of section.stats) {
      const winner = compareWinner(left, right, stat)
      if (winner === 'left') leftWins += 1
      if (winner === 'right') rightWins += 1
    }
  }
  return { leftWins, rightWins }
}

function PlayerHeader({ player, side, wins, loading }) {
  if (loading) {
    return (
      <div className={`compare-player compare-player--${side}`}>
        <div className="compare-avatar compare-avatar--loading skeleton-shimmer" />
        <div className="skeleton-shimmer skeleton-line skeleton-line--lg" />
        <div className="skeleton-shimmer skeleton-line skeleton-line--sm" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className={`compare-player compare-player--${side} compare-player--empty`}>
        <div className="compare-avatar compare-avatar--placeholder" />
        <p className="compare-player-empty">No player loaded</p>
      </div>
    )
  }

  const isWinner = wins.leftWins !== wins.rightWins
    && ((side === 'left' && wins.leftWins > wins.rightWins)
      || (side === 'right' && wins.rightWins > wins.leftWins))

  return (
    <div className={`compare-player compare-player--${side} ${isWinner ? 'compare-player--ahead' : ''}`}>
      {player.avatar_url ? (
        <img src={player.avatar_url} alt="" className="compare-avatar" />
      ) : (
        <div className="compare-avatar compare-avatar--placeholder" />
      )}
      <h2 className="compare-player-name">{player.display_name}</h2>
      <p className="compare-player-user">@{player.username}</p>
      {player.malformed && <MalformedIndicator />}
      <Link to={`/lookup?user=${player.username}`} className="compare-profile-link">
        View profile →
      </Link>
    </div>
  )
}

function CompareRow({ stat, left, right }) {
  const winner = compareWinner(left, right, stat)
  const leftClass = winner === 'left' ? 'compare-value--win' : winner === 'right' ? 'compare-value--lose' : ''
  const rightClass = winner === 'right' ? 'compare-value--win' : winner === 'left' ? 'compare-value--lose' : ''

  return (
    <div className="compare-row">
      <div className={`compare-value compare-value--left ${leftClass}`}>
        {left ? formatStatValue(left, stat) : '—'}
      </div>
      <div className="compare-label">{stat.label}</div>
      <div className={`compare-value compare-value--right ${rightClass}`}>
        {right ? formatStatValue(right, stat) : '—'}
      </div>
    </div>
  )
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [playerOne, setPlayerOne] = useState(searchParams.get('p1') || '')
  const [playerTwo, setPlayerTwo] = useState(searchParams.get('p2') || '')
  const [left, setLeft] = useState(null)
  const [right, setRight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function compare(p1 = playerOne, p2 = playerTwo) {
    const nameOne = p1.trim()
    const nameTwo = p2.trim()
    if (!nameOne || !nameTwo) {
      setError('Enter both usernames to compare.')
      return
    }
    if (nameOne.toLowerCase() === nameTwo.toLowerCase()) {
      setError('Choose two different players.')
      return
    }

    setLoading(true)
    setError('')
    setLeft(null)
    setRight(null)

    try {
      const [leftData, rightData] = await Promise.all([
        getPlayer(nameOne),
        getPlayer(nameTwo),
      ])
      setLeft(leftData)
      setRight(rightData)
      setSearchParams({ p1: leftData.username, p2: rightData.username })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const p1 = searchParams.get('p1')
    const p2 = searchParams.get('p2')
    if (p1 && p2) {
      setPlayerOne(p1)
      setPlayerTwo(p2)
      compare(p1, p2)
    }
  }, []) // only on first load

  function handleSubmit(e) {
    e.preventDefault()
    compare()
  }

  const wins = left && right ? countWins(left, right) : { leftWins: 0, rightWins: 0 }
  const hasResult = left && right

  return (
    <div className="page compare-page">
      <h1>Compare Players</h1>
      <p className="page-desc">
        Pit two players head-to-head. Green highlights the better stat in each row.
      </p>

      <form className="compare-form" onSubmit={handleSubmit}>
        <div className="compare-input-group">
          <label htmlFor="compare-p1">Player 1</label>
          <input
            id="compare-p1"
            type="text"
            placeholder="Username..."
            value={playerOne}
            onChange={(e) => setPlayerOne(e.target.value)}
          />
        </div>
        <span className="compare-vs" aria-hidden>VS</span>
        <div className="compare-input-group">
          <label htmlFor="compare-p2">Player 2</label>
          <input
            id="compare-p2"
            type="text"
            placeholder="Username..."
            value={playerTwo}
            onChange={(e) => setPlayerTwo(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </form>

      {error && <p className="status error">{error}</p>}

      {(loading || hasResult) && (
        <div className="compare-card">
          <div className="compare-headers">
            <PlayerHeader player={left} side="left" wins={wins} loading={loading} />
            <div className="compare-score-center">
              {hasResult && !loading && (
                <>
                  <p className="compare-score-label">Stat wins</p>
                  <p className="compare-score">
                    <span className={wins.leftWins > wins.rightWins ? 'compare-score--lead' : ''}>
                      {wins.leftWins}
                    </span>
                    <span className="compare-score-divider">–</span>
                    <span className={wins.rightWins > wins.leftWins ? 'compare-score--lead' : ''}>
                      {wins.rightWins}
                    </span>
                  </p>
                </>
              )}
              {loading && <p className="compare-score-label">Loading...</p>}
            </div>
            <PlayerHeader player={right} side="right" wins={wins} loading={loading} />
          </div>

          {!loading && hasResult && (
            <div className="compare-stats">
              {STAT_SECTIONS.map((section) => (
                <section key={section.title} className="compare-section">
                  <h3 className="compare-section-title">{section.title}</h3>
                  {section.stats.map((stat) => (
                    <CompareRow
                      key={stat.key}
                      stat={stat}
                      left={left}
                      right={right}
                    />
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !hasResult && !error && (
        <div className="compare-empty">
          <p>Enter two usernames above to see a head-to-head comparison.</p>
        </div>
      )}
    </div>
  )
}
