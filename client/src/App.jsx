import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import PlayPage from './pages/Play.jsx';
import GuestPage from './pages/Guest.jsx';
import Butterfly from './components/Butterfly.jsx';
import HomePage from './pages/Home.jsx';

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="hdr">
      <nav className="nav">
        <Link to="/" className="brand">Guess a Sentence</Link>
        <div className="spacer" />
        <Link to="/play">Play</Link>
        <Link to="/guest">Guest</Link>
        <Link to="/butterfly">Butterfly</Link>
        <div className="spacer" />
        {user ? (
          <>
            <span className="coins">💰 {user.coins}</span>
            <span className="usr">@{user.username}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  return (
    <>
      <Header />
      <main className="main" role="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/play" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/play" /> : <RegisterPage />} />
          <Route path="/play" element={user ? <PlayPage /> : <Navigate to="/login" />} />
          <Route path="/guest" element={<GuestPage />} />
          <Route path="/butterfly" element={<Butterfly />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}
