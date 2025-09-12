import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setOk(''); setPending(true);
    
    // Validazione lato client
    if (password !== confirmPassword) {
      setErr('Le password non corrispondono');
      setPending(false);
      return;
    }
    
    if (password.length < 3) {
      setErr('La password deve essere almeno di 3 caratteri');
      setPending(false);
      return;
    }
    
    if (username.trim().length < 3) {
      setErr('Lo username deve essere almeno di 3 caratteri');
      setPending(false);
      return;
    }
    
    try {
      await register(username.trim(), password);
      setOk('Account created! Welcome!');
      
      // Reindirizza alla home
      setTimeout(() => nav('/'), 800);
    } catch (e) {
      setErr(e.message);
    } finally { setPending(false); }
  };

  return (
    <div className="page-content">
      <Container className="fade-in-up">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="auth-card">
              <Card.Header className="text-center" style={{ backgroundColor: 'var(--primary-bg)', borderBottom: '1px solid var(--border-color)' }}>
                <h2 className="mb-0" style={{ color: 'var(--primary-color)' }}>📝 Register</h2>
                <small style={{ color: 'var(--text-secondary)' }}>Create your account to start playing</small>
              </Card.Header>
              <Card.Body className="p-4">
                {err && (
                  <Alert variant="danger" className="text-center" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-color)', color: 'var(--error-color)' }}>
                    {err}
                  </Alert>
                )}
                {ok && (
                  <Alert variant="success" className="text-center" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-color)', color: 'var(--success-color)' }}>
                    {ok}
                  </Alert>
                )}
                
                <Form onSubmit={onSubmit} noValidate>
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="ru">Username</Form.Label>
                    <Form.Control 
                      id="ru" 
                      required 
                      minLength={3} 
                      maxLength={32}
                      value={username} 
                      onChange={e=>setU(e.target.value)}
                      className="form-control-modern"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="rp">Password</Form.Label>
                    <Form.Control 
                      id="rp" 
                      type="password" 
                      required 
                      minLength={3}
                      value={password} 
                      onChange={e=>setP(e.target.value)}
                      className="form-control-modern"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="rcp">Confirm Password</Form.Label>
                    <Form.Control 
                      id="rcp" 
                      type="password" 
                      required 
                      minLength={3}
                      value={confirmPassword} 
                      onChange={e=>setConfirmPassword(e.target.value)}
                      className="form-control-modern"
                      style={{ borderColor: password && confirmPassword && password !== confirmPassword ? 'var(--error-color)' : '' }}
                    />
                    {password && confirmPassword && password !== confirmPassword && (
                      <small style={{ color: 'var(--error-color)', marginTop: '0.25rem' }}>
                        Le password non corrispondono
                      </small>
                    )}
                  </Form.Group>
                  
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-100 fw-bold" 
                    disabled={pending || (password && confirmPassword && password !== confirmPassword)}
                  >
                    {pending ? 'Creating account...' : 'Create account'}
                  </Button>
                </Form>
                
                <div className="mt-4 text-center">
                  <small style={{ color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none" style={{ color: 'var(--accent-color)' }}>
                      Login here
                    </Link>
                    {' • '}
                    <Link to="/" className="text-decoration-none" style={{ color: 'var(--accent-color)' }}>
                      Back to Home
                    </Link>
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
