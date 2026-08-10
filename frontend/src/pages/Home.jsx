import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home">
      <section className="home-landing">
        <h1 className="home-title">
          <span className="home-title-accent">BOX</span>
          <span className="home-title-slash">/</span>
          <span className="home-title-accent">SLASH</span>
        </h1>
        <p className="home-lead">
          Kill stats, K/D, and player profiles.
        </p>

        <nav className="home-nav">
          <Link to="/leaderboard" className="home-nav-item">
            <span className="home-nav-heading">Leaderboard</span>
            <span className="home-nav-sub">Top 100 by kills</span>
          </Link>
          <Link to="/lookup" className="home-nav-item">
            <span className="home-nav-heading">Profiles</span>
            <span className="home-nav-sub">Search by username</span>
          </Link>
          <Link to="/compare" className="home-nav-item">
            <span className="home-nav-heading">Compare</span>
            <span className="home-nav-sub">Head-to-head</span>
          </Link>
          <Link to="/feedback" className="home-nav-item">
            <span className="home-nav-heading">Feedback</span>
            <span className="home-nav-sub">Send a message</span>
          </Link>
        </nav>
      </section>

      <p className="home-footnote">Live from PlayerStore</p>
    </div>
  )
}
