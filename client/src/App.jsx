import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, createContext, useContext } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { Container, Row, Col, Modal, Button } from 'react-bootstrap';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import PlayPage from './pages/Play.jsx';
import GuestPage from './pages/Guest.jsx';
import Butterfly from './components/Butterfly.jsx';
import HomePage from './pages/Home.jsx';
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
        <a className="navbar-brand fw-bold" href="/" onClick={handleHomeClick} style={{ fontSize: '1.5rem' }}>
          🎮 Guess the Sentence
        </a>
        <div className="navbar-nav ms-auto">
          {user ? (
            <div className="d-flex align-items-center gap-3">
              <span className="text-light">
                Welcome, <strong>{user.username}</strong> | 💰 {user.coins || 0} coins
              </span>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <a href="/login" className="btn btn-outline-light btn-sm">Login</a>
              <a href="/register" className="btn btn-light btn-sm">Register</a>
            </div>
          )}
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
  
  // Check if we're on a game page (play or guest)
  const isGamePage = location.pathname === '/play' || location.pathname === '/guest';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
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
            {/* Butterfly at bottom for game pages */}
            <Row className="mt-4">
              <Col>
                <Butterfly />
              </Col>
            </Row>
          </>
        ) : (
          // Sidebar layout for other pages
          <Row className="h-100">
            <Col lg={9} md={8} sm={12} className="h-100">
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
            <Col lg={3} md={4} className="d-none d-md-block h-100">
              <Butterfly />
            </Col>
          </Row>
        )}

        {/* Home Abandon Confirmation Modal */}
        <Modal show={showHomeAbandonModal} onHide={cancelHomeAbandon} centered>
          <Modal.Header closeButton>
            <Modal.Title>🏠 Return to Home</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to abandon this match and return to the home page?</p>
            <div className="alert alert-warning" role="alert">
              <small>
                ⚠️ <strong>Warning:</strong> You will lose your progress and the sentence will not be revealed.
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelHomeAbandon}>
              No, Continue Playing
            </Button>
            <Button variant="primary" onClick={confirmHomeAbandon}>
              Yes, Go to Home
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
    </MatchContext.Provider>
  );
}

export default App;