import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import PlayerLookup from './pages/PlayerLookup'

function NavBar() {
  const location = useLocation()

  function navClass(path) {
    return location.pathname === path ? 'nav-link active' : 'nav-link'
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-box">BOX</span>
          <span className="logo-slash">/</span>
          <span className="logo-box">SLASH</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={navClass('/')}>Home</Link>
          <Link to="/leaderboard" className={navClass('/leaderboard')}>Leaderboard</Link>
          <Link to="/lookup" className={navClass('/lookup')}>Player Lookup</Link>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/lookup" element={<PlayerLookup />} />
        </Routes>
      </main>
      <footer className="footer">
        not made by Roblox. made by Sai!! The owner of Box/Slash 
      </footer>
    </div>
  )
}
