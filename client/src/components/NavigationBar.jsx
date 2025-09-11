import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

function NavigationBar({ user, onLogout }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="px-2">
      <Container fluid>
        <Navbar.Brand className="me-auto">🎮 Guess Sentence</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link>Home</Nav.Link>
            </LinkContainer>
            {user ? (
              <LinkContainer to="/game">
                <Nav.Link>Play Game</Nav.Link>
              </LinkContainer>
            ) : (
              <LinkContainer to="/guest">
                <Nav.Link>Guest Mode</Nav.Link>
              </LinkContainer>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-2 d-none d-md-block">
                  Welcome, {user.username}!
                </Navbar.Text>
                <Navbar.Text className="me-3">
                  💰 {user.coins !== undefined && user.coins !== null ? user.coins : 0}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>Login</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>Register</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;

// "It's no use going back to yesterday, because I was a different person then." - Alice in Wonderland
