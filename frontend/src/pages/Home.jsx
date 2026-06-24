import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home">
      <section className="home-landing">
        <p className="home-kicker">BoxSlash Datacenter</p>
        <h1 className="home-title">
          <span className="home-title-accent">BOX</span>
          <span className="home-title-slash">/</span>
          <span className="home-title-accent">SLASH</span>
        </h1>
        <p className="home-lead">
          Kill stats, K/D, and full player profiles.
        </p>

        <nav className="home-nav">
          <Link to="/leaderboard" className="home-nav-item home-nav-item--primary">
            <span className="home-nav-heading">Leaderboard</span>
            <span className="home-nav-sub">Top 100 by kills</span>
            <span className="home-nav-arrow" aria-hidden>→</span>
          </Link>
          <Link to="/lookup" className="home-nav-item">
            <span className="home-nav-heading">Player lookup</span>
            <span className="home-nav-sub">Search by username</span>
            <span className="home-nav-arrow" aria-hidden>→</span>
          </Link>
          <Link to="/compare" className="home-nav-item">
            <span className="home-nav-heading">Compare</span>
            <span className="home-nav-sub">Head-to-head stats</span>
            <span className="home-nav-arrow" aria-hidden>→</span>
          </Link>
        </nav>
      </section>

      <div className="home-footnote">
        <span className="home-footnote-dot" aria-hidden />
        Live game data * updates when players earn kills in-game
      </div>
    </div>
  )
}
