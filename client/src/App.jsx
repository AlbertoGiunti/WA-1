import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, createContext, useContext } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { Container, Row, Col } from 'react-bootstrap';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import PlayPage from './pages/Play.jsx';
import GuestPage from './pages/Guest.jsx';
import Butterfly from './components/Butterfly.jsx';
import HomePage from './pages/Home.jsx';
import AbandonMatchModal from './components/AbandonMatchModal.jsx';
import './App.css';

// Context for sharing match abandon functionality
const MatchContext = createContext(null);
export const useMatchContext = () => useContext(MatchContext);

function NavigationBar({ user, onLogout, onHomeClick }) {
  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onHomeClick) {
      onHomeClick();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container-fluid">
        <span className="navbar-brand fw-bold" style={{ fontSize: '1.5rem' }}>
          🎮 Guess the Sentence
        </span>
        <div className="navbar-nav ms-auto">
          <div className="d-flex align-items-center gap-3">
            <button 
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              onClick={handleHomeClick}
            >
              🏠 Home
            </button>
            {user ? (
              <>
                <span className="text-light">
                  Welcome, <strong>{user.username}</strong> | 💰 {user.coins || 0} coins
                </span>
                <button 
                  className="btn btn-outline-light btn-sm"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="btn btn-outline-light btn-sm">Login</a>
                <a href="/register" className="btn btn-light btn-sm">Register</a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showHomeAbandonModal, setShowHomeAbandonModal] = useState(false);
  const [showLogoutAbandonModal, setShowLogoutAbandonModal] = useState(false);
  
  // Check if we're on a game page (play or guest)
  const isGamePage = location.pathname === '/play' || location.pathname === '/guest';

  const handleLogout = async () => {
    // If there's an active match, show confirmation modal
    if (currentMatch && currentMatch.status === 'playing') {
      setShowLogoutAbandonModal(true);
    } else {
      // No active match, logout normally
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  const handleHomeClick = () => {
    // If there's an active match, show confirmation modal
    if (currentMatch && currentMatch.status === 'playing') {
      setShowHomeAbandonModal(true);
    } else {
      // No active match, navigate normally
      window.location.href = '/';
    }
  };

  const confirmHomeAbandon = async () => {
    // Abandon the match and go home
    const isGuest = location.pathname === '/guest';
    const abandonUrl = isGuest 
      ? `/api/guest/matches/${currentMatch.id}/abandon`
      : `/api/matches/${currentMatch.id}/abandon`;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}${abandonUrl}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to abandon match:', error);
    } finally {
      // Navigate home regardless of abandon success/failure
      setShowHomeAbandonModal(false);
      window.location.href = '/';
    }
  };

  const cancelHomeAbandon = () => {
    setShowHomeAbandonModal(false);
  };

  const confirmLogoutAbandon = async () => {
    // Abandon the match and logout
    const isGuest = location.pathname === '/guest';
    const abandonUrl = isGuest 
      ? `/api/guest/matches/${currentMatch.id}/abandon`
      : `/api/matches/${currentMatch.id}/abandon`;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}${abandonUrl}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to abandon match:', error);
    }
    
    // Proceed with logout regardless of abandon success/failure
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setShowLogoutAbandonModal(false);
    }
  };

  const cancelLogoutAbandon = () => {
    setShowLogoutAbandonModal(false);
  };

  const matchContextValue = {
    currentMatch,
    setCurrentMatch
  };

  return (
    <MatchContext.Provider value={matchContextValue}>
      <div className="App">
        <NavigationBar 
          user={user} 
          onLogout={handleLogout}
          onHomeClick={isGamePage ? handleHomeClick : null}
        />
        <Container fluid className="flex-grow-1 mt-3 px-2">
        {isGamePage ? (
          // Full-width layout for game pages
          <>
            <Routes>
              <Route 
                path="/play" 
                element={
                  user ? <PlayPage /> : <Navigate to="/login" />
                } 
              />
              <Route 
                path="/guest" 
                element={<GuestPage />} 
              />
            </Routes>
          </>
        ) : (
          // Sidebar layout for other pages
          <Row className="h-100">
            <Col lg={location.pathname === '/' ? 9 : 12} md={location.pathname === '/' ? 8 : 12} sm={12} className="h-100">
              <Routes>
                <Route 
                  path="/" 
                  element={<HomePage />} 
                />
                <Route 
                  path="/login" 
                  element={
                    user ? <Navigate to="/" /> : <LoginPage />
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    user ? <Navigate to="/" /> : <RegisterPage />
                  } 
                />
              </Routes>
            </Col>
            {/* Show Butterfly only on HOME page */}
            {location.pathname === '/' && (
              <Col lg={3} md={4} className="d-none d-md-block h-100">
                <Butterfly />
              </Col>
            )}
          </Row>
        )}

        {/* Home Abandon Confirmation Modal */}
        <AbandonMatchModal
          show={showHomeAbandonModal}
          onConfirm={confirmHomeAbandon}
          onCancel={cancelHomeAbandon}
          title="🏠 Return to Home"
          message="Are you sure you want to abandon this match and return to the home page?"
          confirmText="Yes, Go to Home"
          cancelText="No, Continue Playing"
          showWarning={true}
        />

        {/* Logout Abandon Confirmation Modal */}
        <AbandonMatchModal
          show={showLogoutAbandonModal}
          onConfirm={confirmLogoutAbandon}
          onCancel={cancelLogoutAbandon}
          title="🚪 Logout"
          message="Are you sure you want to logout? Your current match will be abandoned and you will lose any progress made."
          confirmText="Yes, Logout"
          cancelText="No, Continue Playing"
          showWarning={true}
          isGuest={location.pathname === '/guest'}
        />
      </Container>
    </div>
    </MatchContext.Provider>
  );
}

export default App;