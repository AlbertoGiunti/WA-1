import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Game from './components/Game';
import GuestGame from './components/GuestGame';
import Butterfly from './components/Butterfly';
import { Container, Row, Col } from 'react-bootstrap';
import './App.css';

const API_BASE = 'http://localhost:3002/api';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    fetch(`${API_BASE}/user`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="App">
      <NavigationBar 
        user={user} 
        onLogout={handleLogout}
      />
      <Container fluid className="flex-grow-1 mt-3 px-2">
        <Row className="h-100">
          <Col lg={9} md={8} sm={12} className="h-100">
            <Routes>
              <Route 
                path="/" 
                element={<Home user={user} />} 
              />
              <Route 
                path="/login" 
                element={
                  user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
                } 
              />
              <Route 
                path="/register" 
                element={
                  user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
                } 
              />
              <Route 
                path="/game" 
                element={
                  user ? (
                    <Game 
                      user={user} 
                      setUser={setUser}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                } 
              />
              <Route 
                path="/guest" 
                element={<GuestGame />} 
              />
            </Routes>
          </Col>
          <Col lg={3} md={4} className="d-none d-md-block h-100">
            <Butterfly />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

// "Begin at the beginning," the King said gravely, "and go on till you come to the end: then stop." - Alice in Wonderland
