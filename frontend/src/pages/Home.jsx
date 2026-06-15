import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="page">
      <section className="hero">
        <h1>BoxSlash Stat Tracker</h1>
        <p className="subtitle">
          Track kills and deaths for every player.
        </p>
        <div className="hero-buttons">
          <Link to="/leaderboard" className="btn btn-primary">View Kill Leaderboard</Link>
          <Link to="/lookup" className="btn btn-secondary">Look Up Player</Link>
        </div>
      </section>

      <section className="info-grid">
        <div className="card">
          <h2>Kill Leaderboard</h2>
          <p>See who has the most kills and the best K/D ratio across BoxSlash.</p>
        </div>
        <div className="card">
          <h2>Player Lookup</h2>
          <p>Search any tracked player and view their kill and death breakdown.</p>
        </div>
        <div className="card">
          <h2>Roblox Sync</h2>
          <p>
            Player avatars and display names come from the Roblox API.
            Kill and death counts are tracked by your game.
            Some data may be innacurate, I'm pretty new to web development and APIs so if you see any bugs please let me know!
          </p>
        </div>
      </section>
    </div>
  )
}
