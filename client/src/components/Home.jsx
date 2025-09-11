import { Card, Button, Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Home({ user }) {
  const navigate = useNavigate();

  const handleGuestModeClick = () => {
    navigate('/guest');
  };

  const handleNormalModeClick = () => {
    if (user) {
      navigate('/game');
    } else {
      navigate('/login');
    }
  };

  return (
    <Container fluid className="h-100 d-flex align-items-center justify-content-center">
      <div className="text-center" style={{ maxWidth: '800px', width: '100%' }}>
        {/* Welcome Header */}
        <div className="mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">
            🎮 Guess the Sentence Game
          </h1>
          <p className="lead text-muted">
            Challenge yourself to guess hidden sentences! Choose your preferred game mode below.
          </p>
        </div>

        {/* Game Mode Cards */}
        <Row className="g-4 justify-content-center">
          {/* Guest Mode */}
          <Col lg={5} md={6} sm={12}>
            <Card className="h-100 shadow-sm border-0" style={{ transition: 'transform 0.2s' }} 
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
              <Card.Body className="d-flex flex-column text-center p-4">
                <div className="mb-3">
                  <div className="display-1 mb-3">👤</div>
                  <h3 className="fw-bold text-secondary">Guest Mode</h3>
                </div>
                <div className="mb-4 flex-grow-1">
                  <p className="text-muted mb-3">
                    Play without registration! Perfect for a quick game session.
                  </p>
                  <ul className="list-unstyled text-start">
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
            <Card className="h-100 shadow-sm border-0" style={{ transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
              <Card.Body className="d-flex flex-column text-center p-4">
                <div className="mb-3">
                  <div className="display-1 mb-3">🏆</div>
                  <h3 className="fw-bold text-primary">Normal Mode</h3>
                </div>
                <div className="mb-4 flex-grow-1">
                  <p className="text-muted mb-3">
                    Full game experience with coins, rewards, and challenging sentences!
                  </p>
                  <ul className="list-unstyled text-start">
                    <li className="mb-2">💰 <strong>Coin system & rewards</strong></li>
                    <li className="mb-2">📚 <strong>Variety of sentences</strong></li>
                    <li className="mb-2">🎯 <strong>Strategic letter costs</strong></li>
                    <li className="mb-2">📊 <strong>Progress tracking</strong></li>
                  </ul>
                </div>
                {user ? (
                  <div>
                    <div className="mb-3 p-2 bg-light rounded">
                      <small className="text-muted">Welcome back, <strong>{user.username}</strong>!</small>
                      <div className="text-primary fw-bold">💰 {user.coins || 0} coins available</div>
                    </div>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-100 fw-bold"
                      onClick={handleNormalModeClick}
                      disabled={!user.coins || user.coins <= 0}
                    >
                      {!user.coins || user.coins <= 0 ? 'Not enough coins' : 'Play Normal Mode'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="small text-muted mb-3">
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
        <div className="mt-5 pt-4 border-top">
          <Row className="text-center">
            <Col md={4}>
              <h5 className="fw-bold text-secondary">🎲 Random Sentences</h5>
              <p className="small text-muted">Each game features a different sentence to keep you challenged</p>
            </Col>
            <Col md={4}>
              <h5 className="fw-bold text-secondary">⚡ Fast-Paced</h5>
              <p className="small text-muted">60-second timer adds excitement to every round</p>
            </Col>
            <Col md={4}>
              <h5 className="fw-bold text-secondary">🧠 Strategic</h5>
              <p className="small text-muted">Choose letters wisely based on cost and probability</p>
            </Col>
          </Row>
          
          {!user && (
            <div className="mt-4">
              <p className="text-muted mb-2">
                New to the game? <Button variant="link" className="p-0" onClick={() => navigate('/register')}>Create an account</Button> to unlock the full experience!
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export default Home;
