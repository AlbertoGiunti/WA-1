import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { Container, Row, Col } from 'react-bootstrap';
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import PlayPage from './pages/Play.jsx';
import GuestPage from './pages/Guest.jsx';
import Butterfly from './components/Butterfly.jsx';
import HomePage from './pages/Home.jsx';
import './App.css';

function NavigationBar({ user, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="/" style={{ fontSize: '1.5rem' }}>
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
  
  // Check if we're on a game page (play or guest)
  const isGamePage = location.pathname === '/play' || location.pathname === '/guest';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="App">
      <NavigationBar 
        user={user} 
        onLogout={handleLogout}
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
      </Container>
    </div>
  );
}

export default App;