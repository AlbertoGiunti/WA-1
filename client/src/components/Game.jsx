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
import Butterfly from './Butterfly.jsx';

/**
 * Game component - Main game orchestrator that manages the complete game flow
 * Handles both guest and authenticated user games with proper state management
 * @param {boolean} isGuest - Whether this is a guest game
 */
export default function Game({ isGuest = false }) {
  const { user, syncCoins } = useAuth();
  const { setCurrentMatch } = useMatchContext();
  const navigate = useNavigate();
  
  // Component state management
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState('');
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [isHandlingTimeout, setIsHandlingTimeout] = useState(false);

  /**
   * Updates both local match state and global match context
   */
  const updateMatch = useCallback((newMatch) => {
    setMatch(newMatch);
    setCurrentMatch(newMatch);
  }, [setCurrentMatch]);

  /**
   * Loads current match for authenticated users only
   * Guest users always start fresh games
   */
  const loadCurrentMatch = useCallback(async () => {
    if (isGuest) return;
    
    try { 
      const currentMatch = await api.currentMatch();
      updateMatch(currentMatch);
    } catch { 
      updateMatch(null);
    }
  }, [updateMatch, isGuest]);

  // Note: Don't auto-load on mount - let users explicitly start games
  // This makes guest and authenticated flows consistent

  // Calculate game state
  const finished = match && (match.status !== 'playing');

  /**
   * Handles game timeout with immediate UI update and background server sync
   */
  const handleTimeout = useCallback(async () => {
    if (!match || isHandlingTimeout) {
      return;
    }

    setIsHandlingTimeout(true);
    
    // Immediately update local state to reflect timeout
    const timedOutMatch = { ...match, status: 'lost' };
    updateMatch(timedOutMatch);
    
    // Set appropriate timeout message based on user type
    if (isGuest) {
      setMessage('⏰ Time\'s up! Game Over! In guest mode, no coins are lost.');
    } else {
      const penalty = Math.min(20, user?.coins || 0);
      setMessage(`⏰ Time's up! Game Over! You lost ${penalty} coins as penalty.`);
    }

    // Sync with server in background to get final game state
    try {
      const updatedMatch = isGuest ? 
        await api.guestCurrent(match.id) : 
        await api.currentMatch();
      
      if (updatedMatch) {
        updateMatch(updatedMatch);
        
        if (!isGuest) {
          await syncCoins();
        }
      }
    } catch (err) {
      console.error('Error syncing with server after timeout:', err);
    } finally {
      setIsHandlingTimeout(false);
    }
  }, [match, isGuest, user?.coins, syncCoins, updateMatch, isHandlingTimeout]);

  // Game action handlers
  
  /**
   * Starts a new game for guest or authenticated user
   */
  const startGame = async () => {
    try {
      setIsHandlingTimeout(false);
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

  /**
   * Handles letter guessing with appropriate API calls
   */
  const guessLetter = async (letter) => {
    if (!match || finished) return;
    
    try {
      const result = isGuest ? 
        await api.guestGuessLetter(match.id, letter) : 
        await api.guessLetter(match.id, letter);
      
      updateMatch(result.match); 
      setMessage(result.message);
      
      if (!isGuest) {
        await syncCoins();
      }
    } catch (err) {
      setMessage(`${err.message}`);
    }
  };

  /**
   * Handles sentence guessing with uppercase conversion
   */
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

  // Modal and navigation handlers
  
  /**
   * Shows the abandon match confirmation modal
   */
  const handleAbandonClick = () => {
    setShowAbandonModal(true);
  };

  /**
   * Confirms match abandonment and handles cleanup
   */
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

  /**
   * Cancels the abandon action and closes modal
   */
  const cancelAbandon = () => {
    setShowAbandonModal(false);
  };

  /**
   * Navigates back to home page and clears match context
   */
  const goToHome = () => {
    setCurrentMatch(null);
    navigate('/');
  };

  // Render game layout based on current state
  return (
    <Container className="fade-in-up">
      {!match ? (
        // No active match - show ready to play layout
        <Row className="justify-content-center">
          <Col lg={11}>
            {/* Player information and game statistics */}
            <GameHeader 
              isGuest={isGuest}
              user={user}
              match={match}
            />

            {/* Decorative butterfly positioned between header and ready card */}
            <Row className="mb-3">
              <Col>
                <Butterfly />
              </Col>
            </Row>

            {/* Ready to play screen with start game option */}
            <ReadyToPlay 
              isGuest={isGuest}
              onStart={startGame}
              message={message}
            />
          </Col>
        </Row>
      ) : (
        // Active match - show game interface
        <>
          <Row className="justify-content-center">
            <Col lg={11}>
              {/* Player information and current game statistics */}
              <GameHeader 
                isGuest={isGuest}
                user={user}
                match={match}
              />

              {/* Main game interface with all game controls */}
              <GameInterface 
                match={match}
                user={user}
                finished={finished}
                isGuest={isGuest}
                message={message}
                onGuessLetter={guessLetter}
                onGuessSentence={guessSentence}
                onAbandon={handleAbandonClick}
                onGoHome={goToHome}
                onTimeUp={handleTimeout}
              />
            </Col>
          </Row>
          
          {/* Decorative butterfly at bottom during gameplay */}
          <Row className="mt-4">
            <Col>
              <Butterfly />
            </Col>
          </Row>
        </>
      )}

      {/* Match abandonment confirmation modal */}
      <AbandonMatchModal
        show={showAbandonModal}
        onConfirm={confirmAbandon}
        onCancel={cancelAbandon}
        isGuest={isGuest}
      />
    </Container>
  );
}