import { useState, useCallback, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useMatchContext } from '../App.jsx';
import GameHeader from './GameHeader.jsx';
import ReadyToPlay from './ReadyToPlay.jsx';
import GameInterface from './GameInterface.jsx';
import AbandonMatchModal from './AbandonMatchModal.jsx';

/**
 * Game component - Main game orchestrator
 * @param {boolean} isGuest - Whether this is a guest game
 */
export default function Game({ isGuest = false }) {
  const { user, syncCoins } = useAuth();
  const { setCurrentMatch } = useMatchContext();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState('');
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);

  // Update match state and context
  const updateMatch = useCallback((newMatch) => {
    console.log('🔄 Updating match state:', newMatch);
    setMatch(newMatch);
    setCurrentMatch(newMatch);
  }, [setCurrentMatch]);

  // Load current match for authenticated users
  const loadCurrentMatch = useCallback(async () => {
    if (isGuest) return;
    
    try { 
      const currentMatch = await api.currentMatch();
      updateMatch(currentMatch);
    } catch { 
      updateMatch(null);
    }
  }, [updateMatch, isGuest]);

  // Don't auto-load on mount - let users explicitly start games
  // This makes guest and authenticated flows consistent

  // Game state calculations
  const finished = match && (match.status !== 'playing');

  // Timeout handling
  const handleTimeout = useCallback(async () => {
    if (!match || isHandlingTimeout) {
      console.log('⏸️ Timeout already being handled or no match, skipping');
      return;
    }

    setIsHandlingTimeout(true);
    
    // Immediately update local state to reflect timeout
    console.log(`🕐 ${isGuest ? 'Guest' : 'User'} timeout for match:`, match.id);
    console.log('⚡ Immediately updating local state to lost');
    
    const timedOutMatch = { ...match, status: 'lost' };
    updateMatch(timedOutMatch);
    
    if (isGuest) {
      setMessage('⏰ Time\'s up! Game Over! In guest mode, no coins are lost.');
    } else {
      const penalty = Math.min(20, user?.coins || 0);
      setMessage(`⏰ Time's up! Game Over! You lost ${penalty} coins as penalty.`);
    }

    // Then sync with server in background
    try {
      const updatedMatch = isGuest ? 
        await api.guestCurrent(match.id) : 
        await api.currentMatch();
      
      console.log('📥 Server response after timeout:', updatedMatch);
      
      if (updatedMatch) {
        // Update with server data (especially if it includes the complete sentence)
        updateMatch(updatedMatch);
        
        // Sync coins for authenticated users
        if (!isGuest) {
          await syncCoins();
        }
      }
    } catch (err) {
      console.error('❌ Error syncing with server after timeout:', err);
      // Keep local state as is if server sync fails
    } finally {
      setIsHandlingTimeout(false);
    }
  }, [match, isGuest, user?.coins, syncCoins, updateMatch, isHandlingTimeout]);

  // Game actions
  const startGame = async () => {
    try {
      setIsHandlingTimeout(false); // Reset timeout flag for new game
      const newMatch = isGuest ? await api.guestStart() : await api.startMatch();
      updateMatch(newMatch);
      setMessage(`${isGuest ? 'Guest match' : 'Match'} started! Good luck! 🍀`);
      
      if (!isGuest) {
        await syncCoins();
      }
    } catch (e) { 
      setMessage(`Error: ${e.message}`); 
    }
  };

  const guessLetter = async (letter) => {
    if (!match || finished) return;
    
    try {
      const result = isGuest ? 
        await api.guestGuessLetter(match.id, letter) : 
        await api.guessLetter(match.id, letter);
      
      console.log('🔤 Letter guess result:', result);
      console.log('🔤 Match after letter guess:', result.match);
      
      updateMatch(result.match); 
      setMessage(result.message);
      
      if (!isGuest) {
        await syncCoins();
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const guessSentence = async (sentence) => {
    if (!match || finished) return;
    
    try {
      const result = isGuest ? 
        await api.guestGuessSentence(match.id, sentence.toUpperCase()) : 
        await api.guessSentence(match.id, sentence.toUpperCase());
      
      updateMatch(result.match); 
      setMessage(result.message);
      
      if (!isGuest) {
        await syncCoins();
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleAbandonClick = () => {
    setShowAbandonModal(true);
  };

  const confirmAbandon = async () => {
    if (!match || finished) return;
    
    try {
      if (isGuest) {
        updateMatch(null);
        setMessage('');
      } else {
        await api.abandonMatch(match.id);
        updateMatch(null);
        setMessage('');
        await syncCoins();
      }
      setShowAbandonModal(false);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const cancelAbandon = () => {
    setShowAbandonModal(false);
  };

  const goToHome = () => {
    setCurrentMatch(null);
    navigate('/');
  };

  return (
    <Container className="fade-in-up">
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Game Header - Player info, timer, stats */}
          <GameHeader 
            isGuest={isGuest}
            user={user}
            match={match}
            onTimeUp={handleTimeout}
          />

          {/* Ready to Play Screen */}
          {!match && (
            <ReadyToPlay 
              isGuest={isGuest}
              onStart={startGame}
              message={message}
            />
          )}

          {/* Game Interface */}
          {match && (
            <GameInterface 
              match={match}
              finished={finished}
              isGuest={isGuest}
              message={message}
              onGuessLetter={guessLetter}
              onGuessSentence={guessSentence}
              onAbandon={handleAbandonClick}
              onGoHome={goToHome}
            />
          )}

          {/* Abandon Confirmation Modal */}
          <AbandonMatchModal
            show={showAbandonModal}
            onConfirm={confirmAbandon}
            onCancel={cancelAbandon}
            isGuest={isGuest}
          />
        </Col>
      </Row>
    </Container>
  );
}