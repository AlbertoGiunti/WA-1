import { useEffect, useMemo, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext.jsx';
import Keyboard from '../components/Keyboard.jsx';
import Grid from '../components/Grid.jsx';
import GuessSentence from '../components/GuessSentence.jsx';
import useTick from '../hooks/useTick.js';

export default function PlayPage() {
  const { syncCoins, user } = useAuth();
  const [match, setMatch] = useState(null);
  const [msg, setMsg] = useState('');

  const loadCurrent = useCallback(async () => {
    try { 
      setMatch(await api.currentMatch()); 
    } catch { 
      setMatch(null); 
    }
  }, []);

  useEffect(() => { 
    loadCurrent(); 
  }, [loadCurrent]);

  const onStart = async () => {
    try {
      const m = await api.startMatch();
      setMatch(m);
      setMsg('Match started! Good luck! 🍀');
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
    }
  };

  const now = useTick(500);
  const secondsLeft = useMemo(() => {
    if (!match) return null;
    return Math.max(0, match.endsAt - Math.floor(now / 1000));
  }, [match, now]);

  const timeUp = secondsLeft === 0;
  const finished = match && (match.status !== 'playing' || timeUp);

  const playLetter = async (L) => {
    if (!match || finished) return;
    try {
      const r = await api.guessLetter(match.id, L);
      setMatch(r.match);
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
      setMatch(r.match);
      setMsg(r.message);
      await syncCoins();
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
    }
  };

  const abandon = async () => {
    if (!match || finished) return;
    try {
      const r = await api.abandonMatch(match.id);
      setMatch(r.match);
      setMsg(r.message);
    } catch (e) { 
      setMsg(`Error: ${e.message}`); 
    }
  };

  return (
    <div className="page-content">
      <Container className="fade-in-up">
        <Row className="justify-content-center">
          <Col lg={10}>
          <Card className="game-card mb-4">
            <Card.Header className="text-center" style={{ backgroundColor: 'var(--primary-bg)', borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="mb-0" style={{ color: 'var(--primary-color)' }}>🎯 Play for Coins</h2>
              <small style={{ color: 'var(--text-secondary)' }}>Use your coins wisely to reveal letters!</small>
            </Card.Header>
          </Card>

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
                {(user?.coins || 0) > 0 ? (
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={onStart}
                    className="px-5"
                  >
                    🚀 Start New Match
                  </Button>
                ) : (
                  <Alert variant="warning" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}>
                    <h5>No coins left! 😔</h5>
                    <p className="mb-0">You need coins to play. Try the guest mode instead!</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}

          {match && (
            <>
              {/* Game Status Bar */}
              <Card className="game-card mb-4">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={2}>
                      <Badge 
                        bg={match.status === 'playing' ? 'success' : match.status === 'won' ? 'primary' : 'danger'}
                        className="p-2 fs-6"
                      >
                        {match.status.toUpperCase()}
                      </Badge>
                    </Col>
                    <Col md={3}>
                      <div className={`timer-display ${secondsLeft <= 10 ? 'timer-warning' : ''}`}>
                        ⏰ {secondsLeft ?? '-'}s
                      </div>
                    </Col>
                    <Col md={3}>
                      <Badge bg="warning" className="p-2">
                        💰 {match.remainingCoins || 0} coins
                      </Badge>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted">
                        Letters: {match.guessedLetters.length}
                      </small>
                    </Col>
                    <Col md={2} className="text-end">
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
              <Grid mask={match.revealedMask} spaces={match.spaces} />

              <Keyboard
                guessed={new Set(match.guessedLetters)}
                usedVowel={match.usedVowel}
                disabled={finished}
                onPick={playLetter}
              />

              <GuessSentence disabled={finished} onGuess={playSentence} />
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
