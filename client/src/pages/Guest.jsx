import { useMemo, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMatchContext } from '../App.jsx';
import Grid from '../components/Grid.jsx';
import Keyboard from '../components/Keyboard.jsx';
import GuessSentence from '../components/GuessSentence.jsx';
import useTick from '../hooks/useTick.js';

export default function GuestPage() {
  const { setCurrentMatch } = useMatchContext();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [msg, setMsg] = useState('');
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const updateMatch = (newMatch) => {
    setMatch(newMatch);
    setCurrentMatch(newMatch);
  };

  const start = async () => {
    try {
      const m = await api.guestStart();
      updateMatch(m);
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
          updateMatch(updatedMatch);
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
      updateMatch(r.match); 
      setMsg(r.message);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const guess = async (s) => {
    if (!match || finished) return;
    try {
      const r = await api.guestGuessSentence(match.id, s.toUpperCase());
      updateMatch(r.match); 
      setMsg(r.message);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleAbandonClick = () => {
    setShowAbandonModal(true);
  };

  const confirmAbandon = async () => {
    if (!match || finished) return;
    try {
      const r = await api.guestAbandon(match.id);
      updateMatch(r.match); 
      setShowAbandonModal(false);
      // Navigate to home after abandoning
      navigate('/');
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setShowAbandonModal(false);
    }
  };

  const cancelAbandon = () => {
    setShowAbandonModal(false);
  };

  return (
    <div className="page-content">
      <Container className="fade-in-up">
        <Row className="justify-content-center">
          <Col lg={10}>
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
              {/* Messages - At the top */}
              {msg && (
                <Alert 
                  variant={msg.includes('Error') ? 'danger' : msg.includes('won') || msg.includes('Correct') ? 'success' : 'info'}
                  className="text-center mb-3"
                >
                  {msg}
                </Alert>
              )}

              {/* Grid */}
              <Grid 
                mask={match.revealedMask} 
                spaces={match.spaces} 
                revealed={match.revealed}
                sentence={match.sentence}
                finished={match.status !== 'playing'}
              />

              {/* Compact Status Bar with GuessSentence */}
              <Card className="game-card mb-3">
                <Card.Body className="py-2">
                  <Row className="align-items-center">
                    <Col md={2}>
                      <div className={`timer-display ${secondsLeft <= 10 ? 'timer-warning' : ''}`}>
                        ⏰ {secondsLeft ?? '-'}s
                      </div>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted">
                        {match.guessedLetters.length} letters
                      </small>
                    </Col>
                    <Col md={6}>
                      <GuessSentence disabled={finished} onGuess={guess} compact={true} />
                    </Col>
                    <Col md={2} className="text-end">
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={handleAbandonClick} 
                        disabled={finished}
                      >
                        🏃‍♂️ Abandon
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              {/* Keyboard */}
              <Keyboard
                guessed={new Set(match.guessedLetters)}
                usedVowel={match.usedVowel}
                disabled={finished}
                onPick={pick}
                showCosts={false}
              />
            </>
          )}

          {/* Abandon Confirmation Modal */}
          <Modal show={showAbandonModal} onHide={cancelAbandon} centered>
            <Modal.Header closeButton>
              <Modal.Title>🚨 Abandon Match</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Are you sure you want to abandon this guest match and return to the home page?</p>
              <div className="alert alert-warning" role="alert">
                <small>
                  ⚠️ <strong>Warning:</strong> You will lose your progress and the sentence will not be revealed.
                </small>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={cancelAbandon}>
                No, Continue Playing
              </Button>
              <Button variant="danger" onClick={confirmAbandon}>
                Yes, Go to Home
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
      </Container>
    </div>
  );
}