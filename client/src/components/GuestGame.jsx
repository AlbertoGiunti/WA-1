import { useState, useEffect } from 'react';
import { Card, Button, Alert, Form, Badge, ProgressBar } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const API_BASE = 'http://localhost:3002/api';

function GuestGame() {
  const [structure, setStructure] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [sentenceGuess, setSentenceGuess] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctSentence, setCorrectSentence] = useState('');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  useEffect(() => {
    let timer;
    if (gameStarted && timeRemaining > 0 && !gameOver) {
      timer = setInterval(async () => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Fetch correct sentence when time runs out
            fetchTimeoutStatus();
            setGameOver(true);
            setMessage("Time's up! But no penalty in guest mode!");
            setMessageType('warning');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, timeRemaining, gameOver]);

  const fetchTimeoutStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/match/guest/timeout`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.status === 'timeout' && data.correctSentence) {
        setCorrectSentence(data.correctSentence);
      }
    } catch (error) {
      console.error('Error fetching timeout status:', error);
    }
  };

  const startNewMatch = async () => {
    try {
      const response = await fetch(`${API_BASE}/match/guest`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStructure(data.structure);
        setTimeRemaining(60);
        setGuessedLetters([]);
        setSelectedLetter('');
        setSentenceGuess('');
        setMessage('');
        setGameStarted(true);
        setGameOver(false);
        setCorrectSentence('');
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
    if (!selectedLetter || gameOver) return;

    const upperLetter = selectedLetter.toUpperCase();
    
    if (guessedLetters.includes(upperLetter)) {
      setMessage('Letter already guessed!');
      setMessageType('warning');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/match/guest/guess-letter`, {
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

        if (data.letterFound) {
          setMessage(`Great! Letter "${upperLetter}" found!`);
          setMessageType('success');
        } else {
          setMessage(`Letter "${upperLetter}" not found.`);
          setMessageType('warning');
        }

        // Check if sentence is complete
        if (!data.structure.includes('_')) {
          setGameOver(true);
          setMessage('Congratulations! You revealed the entire sentence!');
          setMessageType('success');
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
    if (!sentenceGuess || gameOver) return;

    try {
      const response = await fetch(`${API_BASE}/match/guest/guess-sentence`, {
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

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <h3 className="mb-2">🎮 Guest Mode - Guess the Sentence</h3>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="text-muted mb-1 mb-md-0">No coins required - Practice mode!</div>
            {gameStarted && (
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
          {message && (
            <Alert variant={messageType} className="mb-3">
              {message}
            </Alert>
          )}

          {!gameStarted ? (
            <div className="text-center">
              <h5>Welcome to Guest Mode!</h5>
              <p>Practice the game without spending coins. Perfect for learning the rules!</p>
              <Button variant="primary" onClick={startNewMatch} className="me-2">
                Start Practice Game
              </Button>
              <LinkContainer to="/register">
                <Button variant="outline-primary">
                  Register for Full Game
                </Button>
              </LinkContainer>
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
                {/* Mobile version */}
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
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3 mb-md-0">
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
                              {alphabet.map(letter => (
                                <option 
                                  key={letter} 
                                  value={letter}
                                  disabled={guessedLetters.includes(letter)}
                                >
                                  {letter}
                                  {guessedLetters.includes(letter) && ' (USED)'}
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
                    </div>

                    <div className="col-md-6">
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
                    </div>
                  </div>

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
                </>
              )}

              {/* Game Over */}
              {gameOver && (
                <div className="text-center">
                  {correctSentence && (
                    <>
                      <h5>Correct Sentence:</h5>
                      <p className="font-monospace fs-5 text-primary">{correctSentence}</p>
                    </>
                  )}
                  <Button variant="primary" onClick={startNewMatch} className="me-2">
                    Play Again
                  </Button>
                  <LinkContainer to="/register">
                    <Button variant="success">
                      Register for Full Game
                    </Button>
                  </LinkContainer>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Guest Mode Information */}
      <Card className="mt-3">
        <Card.Header>ℹ️ About Guest Mode</Card.Header>
        <Card.Body>
          <ul>
            <li>Practice with simplified sentences</li>
            <li>No coins required or earned</li>
            <li>All letters available (no cost restrictions)</li>
            <li>No penalties for wrong guesses</li>
            <li>Register for the full experience with coins and more challenging sentences!</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
}

export default GuestGame;

// "I knew who I was this morning, but I've changed a few times since then." - Alice in Wonderland
