import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    
    try {
      await login(username, password);
      nav('/play');
    } catch (e) { 
      setErr(e.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Container className="fade-in-up">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Header className="text-center">
              <h2 className="mb-0">🔐 Login</h2>
              <small className="text-light">Sign in to play with coins</small>
            </Card.Header>
            <Card.Body className="p-4">
              {err && (
                <Alert variant="danger" className="text-center">
                  {err}
                </Alert>
              )}
              
              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="username">Username</Form.Label>
                  <Form.Control 
                    id="username"
                    type="text"
                    value={username} 
                    onChange={e => setU(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label htmlFor="password">Password</Form.Label>
                  <Form.Control 
                    id="password"
                    type="password" 
                    value={password} 
                    onChange={e => setP(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={loading || !username.trim() || !password.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner me-2"></span>
                        Signing in...
                      </>
                    ) : (
                      '🚀 Sign In'
                    )}
                  </Button>
                </div>
              </Form>
              
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Create one here
                  </Link>
                  {' • '}
                  <Link to="/" className="text-decoration-none">
                    Back to Home
                  </Link>
                </small>
              </div>
              
              <div className="mt-3 text-center">
                <small className="text-muted">
                  <strong>Demo users:</strong> jacopo, bob, alice<br/>
                  <strong>Password:</strong> pwd
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
}
