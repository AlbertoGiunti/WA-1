import { useMemo, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { api } from '../api';
import Grid from '../components/Grid.jsx';
import Keyboard from '../components/Keyboard.jsx';
import GuessSentence from '../components/GuessSentence.jsx';
import useTick from '../hooks/useTick.js';

export default function GuestPage() {
  const [match, setMatch] = useState(null);
  const [msg, setMsg] = useState('');

  const start = async () => {
    try {
      const m = await api.guestStart();
      setMatch(m);
      setMsg('Guest match started! Good luck! 🍀');
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const now = useTick(500);
  const secondsLeft = useMemo(() => {
    if (!match) return null;
    return Math.max(0, match.endsAt - Math.floor(now / 1000));
  }, [match, now]);

  const timeUp = secondsLeft === 0;
  const finished = match && (match.status !== 'playing' || timeUp);

  // Handle automatic timeout
  useEffect(() => {
    if (match && match.status === 'playing' && timeUp) {
      // When time runs out, fetch updated match status from server
      const handleTimeout = async () => {
        try {
          const updatedMatch = await api.guestCurrent(match.id);
          setMatch(updatedMatch);
          if (updatedMatch.status === 'lost') {
            setMsg('⏰ Time\'s up! Game Over!');
          }
        } catch (err) {
          console.error('Error handling timeout:', err);
        }
      };
      handleTimeout();
    }
  }, [match, timeUp]);

  const pick = async (L) => {
    if (!match || finished) return;
    try {
      const r = await api.guestGuessLetter(match.id, L);
      setMatch(r.match); 
      setMsg(r.message);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const guess = async (s) => {
    if (!match || finished) return;
    try {
      const r = await api.guestGuessSentence(match.id, s.toUpperCase());
      setMatch(r.match); 
      setMsg(r.message);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const abandon = async () => {
    if (!match || finished) return;
    try {
      const r = await api.guestAbandon(match.id);
      setMatch(r.match); 
      setMsg(r.message);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page-content">
      <Container className="fade-in-up">
        <Row className="justify-content-center">
          <Col lg={10}>
          <Card className="game-card mb-4">
            <Card.Header className="text-center" style={{ backgroundColor: 'var(--primary-bg)', borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="mb-0" style={{ color: 'var(--primary-color)' }}>🎮 Play as Guest</h2>
              <small style={{ color: 'var(--text-secondary)' }}>No registration required - just for fun!</small>
            </Card.Header>
          </Card>

          {!match && (
            <Card className="game-card text-center">
              <Card.Body className="p-5">
                <h4 style={{ color: 'var(--secondary-color)' }}>Ready to test your word skills? 🧠</h4>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Start a guest game to practice! No coins needed, just pure fun.
                </p>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={start}
                  className="px-5"
                >
                  🚀 Start Guest Match
                </Button>
              </Card.Body>
            </Card>
          )}

          {match && (
            <>
              {/* Game Status Bar */}
              <Card className="game-card mb-4">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={3}>
                      <Badge 
                        bg={match.status === 'playing' ? 'success' : match.status === 'won' ? 'primary' : 'danger'}
                        className="p-2 fs-6"
                      >
                        Status: {match.status.toUpperCase()}
                      </Badge>
                    </Col>
                    <Col md={3}>
                      <div className={`timer-display ${secondsLeft <= 10 ? 'timer-warning' : ''}`}>
                        ⏰ {secondsLeft ?? '-'}s
                      </div>
                    </Col>
                    <Col md={3}>
                      <small className="text-muted">
                        Letters guessed: {match.guessedLetters.length}
                      </small>
                    </Col>
                    <Col md={3} className="text-end">
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={abandon} 
                        disabled={finished}
                      >
                        🏃‍♂️ Abandon
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Game Components */}
              <Grid 
                mask={match.revealedMask} 
                spaces={match.spaces} 
                revealed={match.revealed}
                sentence={match.sentence}
                finished={match.status !== 'playing'}
              />
              
              <Keyboard
                guessed={new Set(match.guessedLetters)}
                usedVowel={match.usedVowel}
                disabled={finished}
                onPick={pick}
              />
              
              <GuessSentence disabled={finished} onGuess={guess} />
            </>
          )}

          {/* Messages */}
          {msg && (
            <Alert 
              variant={msg.includes('Error') ? 'danger' : msg.includes('won') || msg.includes('Correct') ? 'success' : 'info'}
              className="text-center"
            >
              {msg}
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
    </div>
  );
}
