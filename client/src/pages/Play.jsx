import { useEffect, useMemo, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMatchContext } from '../App.jsx';
import Keyboard from '../components/Keyboard.jsx';
import Grid from '../components/Grid.jsx';
import GuessSentence from '../components/GuessSentence.jsx';
import useTick from '../hooks/useTick.js';

export default function PlayPage() {
  const { syncCoins, user } = useAuth();
  const { setCurrentMatch } = useMatchContext();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [msg, setMsg] = useState('');
  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);

  const updateMatch = useCallback((newMatch) => {
    setMatch(newMatch);
    setCurrentMatch(newMatch);
  }, [setCurrentMatch]);

  const loadCurrent = useCallback(async () => {
    try { 
      const currentMatch = await api.currentMatch();
      updateMatch(currentMatch);
    } catch { 
      updateMatch(null);
    }
  }, [updateMatch]);

  useEffect(() => { 
    loadCurrent(); 
  }, [loadCurrent]);

  const onStart = async () => {
    try {
      const m = await api.startMatch();
      updateMatch(m);
      setMsg('Match started! Good luck! 🍀');
      await syncCoins();
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
    }
  };

  const now = useTick(500, match && match.status === 'playing');
  const secondsLeft = useMemo(() => {
    if (!match) return null;
    return Math.max(0, match.endsAt - Math.floor(now / 1000));
  }, [match, now]);

  const timeUp = secondsLeft === 0;
  const finished = match && (match.status !== 'playing' || timeUp);

  // Handle automatic timeout
  useEffect(() => {
    if (match && match.status === 'playing' && timeUp && !isHandlingTimeout) {
      // When time runs out, fetch updated match status from server
      const handleTimeout = async () => {
        setIsHandlingTimeout(true);
        try {
          console.log('🕐 Handling timeout for match:', match.id);
          const updatedMatch = await api.currentMatch();
          console.log('📥 Server response:', updatedMatch);
          
          if (updatedMatch && updatedMatch.status === 'lost') {
            updateMatch(updatedMatch);
            // Calculate penalty message
            const penalty = Math.min(20, user?.coins || 0);
            const coinsLost = penalty > 0 ? penalty : user?.coins || 0;
            setMsg(`⏰ Time's up! Game Over! You lost ${coinsLost} coins as penalty.`);
            await syncCoins(); // Update coins display
          } else if (updatedMatch && (updatedMatch.status === 'won' || updatedMatch.status === 'lost')) {
            // Match finished (won or lost), update to show final state
            updateMatch(updatedMatch);
            if (updatedMatch.status === 'won') {
              setMsg('🎉 Congratulations! You won!');
            }
          } else if (!updatedMatch) {
            // No current match from server - this should not happen during timeout
            console.log('⚠️ No current match from server during timeout handling');
            // Don't clear the match immediately, keep the current state for user to see result
          } else {
            // Match still exists but not finished yet, update anyway
            updateMatch(updatedMatch);
          }
        } catch (err) {
          console.error('❌ Error handling timeout:', err);
          // Even on error, try to clear the match state
          updateMatch(null);
        } finally {
          setIsHandlingTimeout(false);
        }
      };
      handleTimeout();
    }
  }, [match?.id, match?.status, timeUp, isHandlingTimeout, syncCoins, updateMatch]);

  const playLetter = async (L) => {
    if (!match || finished) return;
    try {
      const r = await api.guessLetter(match.id, L);
      updateMatch(r.match);
      setMsg(r.message);
      await syncCoins();
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
    }
  };

  const playSentence = async (s) => {
    if (!match || finished) return;
    try {
      const r = await api.guessSentence(match.id, s.toUpperCase());
      updateMatch(r.match);
      setMsg(r.message);
      await syncCoins();
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
    }
  };

  const handleAbandonClick = () => {
    setShowAbandonModal(true);
  };

  const confirmAbandon = async () => {
    if (!match || finished) return;
    try {
      const r = await api.abandonMatch(match.id);
      updateMatch(r.match);
      setShowAbandonModal(false);
      // Navigate to home after abandoning
      navigate('/');
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
      setShowAbandonModal(false);
    }
  };

  const cancelAbandon = () => {
    setShowAbandonModal(false);
  };

  const goToHome = () => {
    // Clear match context and navigate to home
    setCurrentMatch(null);
    navigate('/');
  };

  return (
    <div className="page-content">
      <Container className="fade-in-up">
        <Row className="justify-content-center">
          <Col lg={10}>
          {!match && (
            <Card className="game-card text-center">
              <Card.Body className="p-5">
                <h4 style={{ color: 'var(--secondary-color)' }}>Ready to play? 🎮</h4>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Each letter costs coins. Vowels cost 10 coins, consonants vary by frequency.
                  Win the game to earn 100 bonus coins!
                </p>
                <div className="mb-4">
                  <Badge className="p-3 fs-5" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
                    💰 Current Balance: {user?.coins || 0} coins
                  </Badge>
                </div>
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={onStart}
                  className="px-5"
                >
                  🚀 Start New Match
                </Button>
                {(user?.coins || 0) === 0 && (
                  <Alert variant="info" className="mt-3" style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-color)', color: 'var(--info-color)' }}>
                    <small>💡 <strong>Tip:</strong> You have no coins, but you can still win by guessing the complete sentence to earn 100 coins!</small>
                  </Alert>
                )}
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
                      <Badge bg="warning" className="p-2" style={{ fontSize: '1.2rem', padding: '0.5rem 0.75rem' }}>
                        💰 {user?.coins || 0}
                      </Badge>
                    </Col>
                    <Col md={6}>
                      <GuessSentence disabled={finished} onGuess={playSentence} compact={true} />
                    </Col>
                    <Col md={2} className="text-end">
                      {(match.status === 'won' || match.status === 'lost') ? (
                        <Button 
                          variant={match.status === 'won' ? 'success' : 'danger'} 
                          size="sm"
                          onClick={goToHome}
                        >
                          🏠 Home
                        </Button>
                      ) : (
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={handleAbandonClick} 
                          disabled={finished}
                        >
                          🏃‍♂️ Abandon
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Keyboard */}
              <Keyboard
                guessed={new Set(match.guessedLetters)}
                usedVowel={match.usedVowel}
                disabled={finished}
                onPick={playLetter}
              />
            </>
          )}

          {/* Abandon Confirmation Modal */}
          <Modal show={showAbandonModal} onHide={cancelAbandon} centered>
            <Modal.Header closeButton>
              <Modal.Title>🚨 Abandon Match</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Are you sure you want to abandon this match and return to the home page?</p>
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
