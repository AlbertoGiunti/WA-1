import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, Badge, Row, Col, ProgressBar, Collapse } from 'react-bootstrap';
import Butterfly from './Butterfly';

const API_BASE = 'http://localhost:3002/api';

function Game({ user, setUser }) {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [structure, setStructure] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [sentenceGuess, setSentenceGuess] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [letterCosts, setLetterCosts] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [correctSentence, setCorrectSentence] = useState('');
  const [vowelUsed, setVowelUsed] = useState(false);
  const [showMobileButterfly, setShowMobileButterfly] = useState(false);

  const vowels = ['A', 'E', 'I', 'O', 'U'];

  useEffect(() => {
    fetchLetterCosts();
  }, []);

  useEffect(() => {
    let timer;
    if (match && timeRemaining > 0 && !gameOver) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            checkMatchStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [match, timeRemaining, gameOver]);

  const fetchLetterCosts = async () => {
    try {
      const response = await fetch(`${API_BASE}/letters/costs`);
      const data = await response.json();
      setLetterCosts(data);
    } catch (error) {
      console.error('Error fetching letter costs:', error);
    }
  };

  const checkMatchStatus = useCallback(async () => {
    if (!match) return;

    try {
      const response = await fetch(`${API_BASE}/match/${match.id}/status`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.status === 'timeout') {
        setGameOver(true);
        setCorrectSentence(data.correctSentence);
        
        // Handle penalty and coin balance safely
        const penalty = data.penalty || 0;
        const newCoinBalance = data.newCoinBalance !== undefined ? data.newCoinBalance : (user.coins - penalty);
        
        // Use server message if available, otherwise fallback
        const message = data.message || `Time's up! You lost ${penalty} coins.`;
        setMessage(message);
        setMessageType('danger');
        
        // Update user coins with the correct balance
        setUser(prev => ({ 
          ...prev, 
          coins: Math.max(0, newCoinBalance) // Ensure coins never go negative
        }));
      }
    } catch (error) {
      console.error('Error checking match status:', error);
    }
  }, [match, setUser, user.coins]);

  const startNewMatch = async () => {
    try {
      // First refresh user data to get current coin balance
      const userResponse = await fetch(`${API_BASE}/user`, {
        credentials: 'include'
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
        
        // Check if user has enough coins
        if (userData.user.coins === undefined || userData.user.coins === null || userData.user.coins <= 0) {
          setMessage('Not enough coins to start a new match');
          setMessageType('danger');
          return;
        }
      }

      const response = await fetch(`${API_BASE}/match/start`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMatch({ id: data.matchId });
        setStructure(data.structure);
        setTimeRemaining(60);
        setGuessedLetters([]);
        setSelectedLetter('');
        setSentenceGuess('');
        setMessage('');
        setMessageType('');
        setGameOver(false);
        setCorrectSentence('');
        setVowelUsed(false);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error);
        setMessageType('danger');
      }
    } catch (error) {
      setMessage('Error starting match');
      setMessageType('danger');
    }
  };

  const guessLetter = async () => {
    if (!selectedLetter || !match || gameOver) return;

    const upperLetter = selectedLetter.toUpperCase();
    
    if (guessedLetters.includes(upperLetter)) {
      setMessage('Letter already guessed!');
      setMessageType('warning');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/match/${match.id}/guess-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ letter: upperLetter })
      });

      const data = await response.json();

      if (response.ok) {
        setStructure(data.structure);
        setGuessedLetters(prev => [...prev, upperLetter]);
        setSelectedLetter('');
        
        if (vowels.includes(upperLetter)) {
          setVowelUsed(true);
        }

        if (data.letterFound) {
          setMessage(`Great! Letter "${upperLetter}" found! Cost: ${data.cost} coins`);
          setMessageType('success');
        } else {
          setMessage(`Letter "${upperLetter}" not found. Cost: ${data.cost} coins (doubled for wrong guess)`);
          setMessageType('warning');
        }

        // Update user coins
        setUser(prev => ({ ...prev, coins: data.coinsRemaining }));

        // Check if sentence is complete
        if (!data.structure.includes('_')) {
          setGameOver(true);
          setMessage('Congratulations! You revealed the entire sentence! You won 100 coins!');
          setMessageType('success');
          setUser(prev => ({ ...prev, coins: prev.coins + 100 }));
        }
      } else {
        setMessage(data.error);
        setMessageType('danger');
      }
    } catch (error) {
      setMessage('Error guessing letter');
      setMessageType('danger');
    }
  };

  const guessSentence = async () => {
    if (!sentenceGuess || !match || gameOver) return;

    try {
      const response = await fetch(`${API_BASE}/match/${match.id}/guess-sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sentence: sentenceGuess })
      });

      const data = await response.json();

      if (data.success) {
        setGameOver(true);
        setCorrectSentence(data.correctSentence);
        setMessage(data.message);
        setMessageType('success');
        setUser(prev => ({ ...prev, coins: prev.coins + data.coinsEarned }));
      } else {
        setMessage(data.message);
        setMessageType('warning');
      }
      setSentenceGuess('');
    } catch (error) {
      setMessage('Error guessing sentence');
      setMessageType('danger');
    }
  };

  const abandonMatch = async () => {
    if (!match || gameOver) return;

    try {
      const response = await fetch(`${API_BASE}/match/${match.id}/abandon`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      setGameOver(true);
      setCorrectSentence(data.correctSentence);
      setMessage(data.message);
      setMessageType('info');
    } catch (error) {
      setMessage('Error abandoning match');
      setMessageType('danger');
    }
  };

  const getLetterCost = (letter) => {
    return letterCosts[letter.toUpperCase()] || 1;
  };

  const canAffordLetter = (letter) => {
    const userCoins = user.coins !== undefined && user.coins !== null ? user.coins : 0;
    return userCoins >= getLetterCost(letter);
  };

  const isVowel = (letter) => {
    return vowels.includes(letter.toUpperCase());
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <h3 className="mb-2">🎯 Guess the Sentence Game</h3>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="mb-1 mb-md-0">💰 Coins: {user.coins !== undefined && user.coins !== null ? user.coins : 0}</div>
            {match && (
              <div className="d-flex align-items-center">
                <span className="me-2">⏰ {timeRemaining}s</span>
                <ProgressBar 
                  now={(timeRemaining / 60) * 100} 
                  style={{ width: '80px' }}
                  variant={timeRemaining <= 10 ? 'danger' : 'primary'}
                />
              </div>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {/* Mobile Butterfly Toggle */}
          <div className="d-block d-md-none mb-3">
            <Button 
              variant="outline-info" 
              size="sm" 
              onClick={() => setShowMobileButterfly(!showMobileButterfly)}
              className="w-100"
            >
              {showMobileButterfly ? 'Hide' : 'Show'} Letter Costs 🦋
            </Button>
            <Collapse in={showMobileButterfly}>
              <div className="mt-2">
                <Butterfly />
              </div>
            </Collapse>
          </div>

          {message && (
            <Alert variant={messageType} className="mb-3">
              {message}
            </Alert>
          )}

          {!match ? (
            <div className="text-center">
              <h5>Ready to play?</h5>
              <p>Each match costs coins to guess letters. Win by guessing the complete sentence!</p>
              <Button 
                variant="primary" 
                onClick={startNewMatch}
                disabled={(user.coins === undefined || user.coins === null || user.coins <= 0)}
              >
                {(user.coins === undefined || user.coins === null || user.coins <= 0) ? 'Not enough coins' : 'Start New Match'}
              </Button>
            </div>
          ) : (
            <div>
              {/* Sentence Structure */}
              <div className="text-center mb-4">
                <h4 className="font-monospace letter-spacing d-none d-md-block">
                  {(gameOver && correctSentence ? correctSentence : structure).split('').map((char, index) => {
                    const isCorrectSentence = gameOver && correctSentence;
                    const wasGuessed = !isCorrectSentence || (structure[index] && structure[index] !== '_');
                    
                    return (
                      <span key={index} className="mx-1">
                        {char === ' ' ? (
                          <span className="text-muted">|</span>
                        ) : isCorrectSentence && !wasGuessed ? (
                          <span className="border-bottom border-2 border-danger px-2 py-1 text-danger fw-bold">
                            {char}
                          </span>
                        ) : char === '_' ? (
                          <span className="border-bottom border-2 border-dark px-2 py-1">_</span>
                        ) : (
                          <span className="border-bottom border-2 border-success px-2 py-1 text-success fw-bold">
                            {char}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </h4>
                {/* Mobile version with smaller text */}
                <div className="font-monospace letter-spacing d-block d-md-none" style={{fontSize: '0.8rem'}}>
                  {(gameOver && correctSentence ? correctSentence : structure).split('').map((char, index) => {
                    const isCorrectSentence = gameOver && correctSentence;
                    const wasGuessed = !isCorrectSentence || (structure[index] && structure[index] !== '_');
                    
                    return (
                      <span key={index} className="mx-1">
                        {char === ' ' ? (
                          <span className="text-muted">|</span>
                        ) : isCorrectSentence && !wasGuessed ? (
                          <span className="border-bottom border-2 border-danger px-1 py-1 text-danger fw-bold">
                            {char}
                          </span>
                        ) : char === '_' ? (
                          <span className="border-bottom border-2 border-dark px-1 py-1">_</span>
                        ) : (
                          <span className="border-bottom border-2 border-success px-1 py-1 text-success fw-bold">
                            {char}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {!gameOver && (
                <>
                  {/* Letter Guessing */}
                  <Row className="mb-3">
                    <Col md={6} className="mb-3 mb-md-0">
                      <Card>
                        <Card.Header>Guess a Letter</Card.Header>
                        <Card.Body>
                          <Form.Group className="mb-3">
                            <Form.Label>Select Letter:</Form.Label>
                            <Form.Select
                              value={selectedLetter}
                              onChange={(e) => setSelectedLetter(e.target.value)}
                              size="sm"
                            >
                              <option value="">Choose a letter...</option>
                              {Object.keys(letterCosts).map(letter => (
                                <option 
                                  key={letter} 
                                  value={letter}
                                  disabled={
                                    guessedLetters.includes(letter) ||
                                    !canAffordLetter(letter) ||
                                    (isVowel(letter) && vowelUsed)
                                  }
                                >
                                  {letter} - {getLetterCost(letter)} coins
                                  {isVowel(letter) && ' (VOWEL)'}
                                  {guessedLetters.includes(letter) && ' (USED)'}
                                  {!canAffordLetter(letter) && ' (TOO EXPENSIVE)'}
                                  {isVowel(letter) && vowelUsed && ' (VOWEL ALREADY USED)'}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Button 
                            variant="primary" 
                            onClick={guessLetter}
                            disabled={!selectedLetter}
                            size="sm"
                            className="w-100"
                          >
                            Guess Letter
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card>
                        <Card.Header>Guess the Sentence</Card.Header>
                        <Card.Body>
                          <Form.Group className="mb-3">
                            <Form.Control
                              type="text"
                              placeholder="Enter your complete sentence guess..."
                              value={sentenceGuess}
                              onChange={(e) => setSentenceGuess(e.target.value)}
                              size="sm"
                            />
                          </Form.Group>
                          <Button 
                            variant="success" 
                            onClick={guessSentence}
                            disabled={!sentenceGuess.trim()}
                            size="sm"
                            className="w-100"
                          >
                            Guess Sentence
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Guessed Letters */}
                  {guessedLetters.length > 0 && (
                    <div className="mb-3">
                      <strong>Guessed Letters: </strong>
                      {guessedLetters.map(letter => (
                        <Badge key={letter} bg="secondary" className="me-1">
                          {letter}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Abandon Match */}
                  <div className="text-center">
                    <Button variant="outline-danger" onClick={abandonMatch}>
                      Abandon Match
                    </Button>
                  </div>
                </>
              )}

              {/* Game Over */}
              {gameOver && correctSentence && (
                <div className="text-center">
                  <div className="mb-3">
                    {message && (
                      <Alert variant={messageType || 'info'} className="mb-3">
                        {message}
                      </Alert>
                    )}
                  </div>
                  <h5>Correct Sentence:</h5>
                  <p className="font-monospace fs-5 text-primary">{correctSentence}</p>
                  <div className="d-flex gap-2 justify-content-center flex-wrap">
                    <Button 
                      variant="primary" 
                      onClick={startNewMatch}
                      disabled={(user.coins === undefined || user.coins === null || user.coins <= 0)}
                    >
                      {(user.coins === undefined || user.coins === null || user.coins <= 0) ? 'Not enough coins' : 'Start New Match'}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => navigate('/')}
                    >
                      Return to Home
                    </Button>
                  </div>
                  {(user.coins === undefined || user.coins === null || user.coins <= 0) && (
                    <p className="text-muted mt-2">
                      You need coins to play. Try the guest mode or contact support.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Game;

// "Everything's got a moral, if only you can find it." - Alice in Wonderland
