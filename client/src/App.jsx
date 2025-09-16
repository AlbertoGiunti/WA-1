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

/**
 * Context for sharing current match state and abandonment functionality across components
 * Provides match state management for handling active game sessions
 */
const MatchContext = createContext(null);

/**
 * Custom hook to access the match context
 * @returns {Object} Match context with currentMatch state and setCurrentMatch function
 */
export const useMatchContext = () => useContext(MatchContext);

/**
 * Navigation bar component with responsive design and user authentication state
 * Handles home navigation with match abandonment checks and user session management
 * @param {Object} user - Current authenticated user object
 * @param {Function} onLogout - Callback for logout action
 * @param {Function} onHomeClick - Callback for home navigation (with match checks)
 */
function NavigationBar({ user, onLogout, onHomeClick }) {
  /**
   * Handles home navigation with proper routing
   * Uses onHomeClick callback if provided (for match abandonment checks)
   * Otherwise falls back to direct navigation
   */
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
        {/* Application brand/title */}
        <span className="navbar-brand fw-bold" style={{ fontSize: '1.5rem' }}>
          🎮 Guess the Sentence
        </span>
        
        {/* Navigation items aligned to the right */}
        <div className="navbar-nav ms-auto">
          <div className="d-flex align-items-center gap-3">
            {/* Home navigation button */}
            <button 
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
              onClick={handleHomeClick}
            >
              🏠 Home
            </button>
            
            {/* User authentication section */}
            {user ? (
              // Authenticated user display and logout
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
              // Guest user login/register links
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

/**
 * Main application component that handles routing, authentication, and match state management
 * Provides navigation with match abandonment protection and responsive layout switching
 */
function App() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Match state management
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showHomeAbandonModal, setShowHomeAbandonModal] = useState(false);
  const [showLogoutAbandonModal, setShowLogoutAbandonModal] = useState(false);
  
  // Determine if current page requires full-width layout (game pages)
  const isGamePage = location.pathname === '/play' || location.pathname === '/guest';

  /**
   * Handles logout with match abandonment protection
   * Shows confirmation modal if there's an active match, otherwise logs out immediately
   */
  const handleLogout = async () => {
    if (currentMatch && currentMatch.status === 'playing') {
      setShowLogoutAbandonModal(true);
    } else {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  /**
   * Handles home navigation with match abandonment protection
   * Shows confirmation modal if there's an active match, otherwise navigates immediately
   */
  const handleHomeClick = () => {
    if (currentMatch && currentMatch.status === 'playing') {
      setShowHomeAbandonModal(true);
    } else {
      window.location.href = '/';
    }
  };

  /**
   * Confirms home navigation and abandons current match
   * Makes API call to abandon match before navigating to home page
   */
  const confirmHomeAbandon = async () => {
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
      setShowHomeAbandonModal(false);
      window.location.href = '/';
    }
  };

  /**
   * Cancels home navigation and keeps current match active
   */
  const cancelHomeAbandon = () => {
    setShowHomeAbandonModal(false);
  };

  /**
   * Confirms logout and abandons current match
   * Makes API call to abandon match before proceeding with logout
   */
  const confirmLogoutAbandon = async () => {
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

  /**
   * Cancels logout action and keeps current session active
   */
  const cancelLogoutAbandon = () => {
    setShowLogoutAbandonModal(false);
  };

  // Match context value for child components
  const matchContextValue = {
    currentMatch,
    setCurrentMatch
  };

  return (
    <MatchContext.Provider value={matchContextValue}>
      <div className="App">
        {/* Navigation bar with user state and home navigation protection */}
        <NavigationBar 
          user={user} 
          onLogout={handleLogout}
          onHomeClick={isGamePage ? handleHomeClick : null}
        />
        
        {/* Main content area with responsive layout */}
        <Container fluid className="flex-grow-1 mt-3 px-2">
          {isGamePage ? (
            // Full-width layout for game pages (Play/Guest)
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
            // Sidebar layout for informational pages (Home/Login/Register)
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
              
              {/* Butterfly sidebar - only displayed on home page */}
              {location.pathname === '/' && (
                <Col lg={3} md={4} className="d-none d-md-block h-100">
                  <Butterfly />
                </Col>
              )}
            </Row>
          )}

          {/* Modal dialogs for match abandonment confirmation */}
          
          {/* Home navigation confirmation modal */}
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

          {/* Logout confirmation modal */}
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