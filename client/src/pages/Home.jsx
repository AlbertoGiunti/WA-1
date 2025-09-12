// client/src/pages/Home.jsx
import { Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGuestModeClick = () => navigate('/guest');
  const handleNormalModeClick = () => {
    if (user) return navigate('/play');
    return navigate('/login');
  };

  return (
    <div className="page-content">
      <div className="text-center fade-in-up" style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>
        {/* Welcome Header */}
        <div className="mb-5">
          <h1 className="display-5 fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
            � Guess the Sentence
          </h1>
          <p className="lead" style={{ color: 'var(--text-secondary)' }}>
            Challenge yourself to guess hidden sentences! Choose your preferred game mode below.
          </p>
        </div>

        {/* Game Mode Cards */}
        <Row className="g-4 justify-content-center">
          {/* Guest Mode */}
          <Col lg={5} md={6} sm={12}>
            <Card className="game-card h-100">
              <Card.Body className="d-flex flex-column text-center p-4">
                <div className="mb-3">
                  <div className="display-1 mb-3">👤</div>
                  <h3 className="fw-bold" style={{ color: 'var(--secondary-color)' }}>Guest Mode</h3>
                </div>
                <div className="mb-4 flex-grow-1">
                  <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Play without registration! Perfect for a quick game session.
                  </p>
                  <ul className="list-unstyled text-start mx-auto" style={{ maxWidth: 360 }}>
                    <li className="mb-2">🎯 <strong>Simple sentences</strong></li>
                    <li className="mb-2">⏱️ <strong>60 seconds per game</strong></li>
                    <li className="mb-2">🆓 <strong>No coins required</strong></li>
                    <li className="mb-2">📱 <strong>No registration needed</strong></li>
                  </ul>
                </div>
                <Button
                  variant="outline-primary"
                  size="lg"
                  className="w-100 fw-bold"
                  onClick={handleGuestModeClick}
                >
                  Play as Guest
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Normal Mode */}
          <Col lg={5} md={6} sm={12}>
            <Card className="game-card h-100">
              <Card.Body className="d-flex flex-column text-center p-4">
                <div className="mb-3">
                  <div className="display-1 mb-3">🏆</div>
                  <h3 className="fw-bold" style={{ color: 'var(--accent-color)' }}>Game Mode</h3>
                </div>
                <div className="mb-4 flex-grow-1">
                  <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Full experience with coins, rewards, and challenging sentences!
                  </p>
                  <ul className="list-unstyled text-start mx-auto" style={{ maxWidth: 360 }}>
                    <li className="mb-2">💰 <strong>Coin system & rewards</strong></li>
                    <li className="mb-2">📚 <strong>Variety of sentences</strong></li>
                    <li className="mb-2">🎯 <strong>Strategic letter costs</strong></li>
                    <li className="mb-2">📊 <strong>Progress tracking</strong></li>
                  </ul>
                </div>

                {user ? (
                  <div>
                    <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)' }}>
                      <small style={{ color: 'var(--text-secondary)' }}>
                        Welcome back, <strong>{user.username}</strong>!
                      </small>
                      <div className="fw-bold" style={{ color: 'var(--primary-color)' }}>💰 {user.coins ?? 0} coins available</div>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 fw-bold"
                      onClick={handleNormalModeClick}
                      disabled={!user.coins || user.coins <= 0}
                    >
                      {!user.coins || user.coins <= 0 ? 'Not enough coins' : 'Start Game'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="small mb-3" style={{ color: 'var(--text-secondary)' }}>
                      <em>Login required for this mode</em>
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 fw-bold"
                      onClick={handleNormalModeClick}
                    >
                      Login to Play
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Additional Info */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <Row className="text-center g-4">
            <Col md={4}>
              <h5 className="fw-bold" style={{ color: 'var(--secondary-color)' }}>🎲 Random Sentences</h5>
              <p className="small" style={{ color: 'var(--text-secondary)' }}>Each game features a different sentence to keep you challenged.</p>
            </Col>
            <Col md={4}>
              <h5 className="fw-bold" style={{ color: 'var(--secondary-color)' }}>⚡ Fast-Paced</h5>
              <p className="small" style={{ color: 'var(--text-secondary)' }}>60-second timer adds excitement to every round.</p>
            </Col>
            <Col md={4}>
              <h5 className="fw-bold" style={{ color: 'var(--secondary-color)' }}>🧠 Strategic</h5>
              <p className="small" style={{ color: 'var(--text-secondary)' }}>Choose letters wisely based on cost and frequency.</p>
            </Col>
          </Row>

          {!user && (
            <div className="mt-4">
              <p style={{ color: 'var(--text-secondary)' }} className="mb-2">
                New to the game?{' '}
                <Button variant="link" className="p-0 align-baseline" style={{ color: 'var(--accent-color)' }} onClick={() => navigate('/register')}>
                  Create an account
                </Button>{' '}
                to unlock the full experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
