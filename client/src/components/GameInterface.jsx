import { useMemo } from 'react';
import { Row, Col, Alert } from 'react-bootstrap';
import Grid from './Grid.jsx';
import Keyboard from './Keyboard.jsx';
import GuessSentence from './GuessSentence.jsx';
import GameControls from './GameControls.jsx';
import Timer from './Timer.jsx';

/**
 * GameInterface component - Main game interface during active gameplay
 * Renders all game elements including grid, keyboard, timer, and controls
 * 
 * @param {Object} match - Current match object with game state
 * @param {Object} user - Current user object (contains coins info for authenticated users)
 * @param {boolean} finished - Whether the game has ended (won/lost/abandoned)
 * @param {boolean} isGuest - Whether this is guest mode (affects cost display and validation)
 * @param {string} message - Game feedback message to display to user
 * @param {Function} onGuessLetter - Callback for letter guess attempts
 * @param {Function} onGuessSentence - Callback for full sentence guess attempts
 * @param {Function} onAbandon - Callback for abandon match action
 * @param {Function} onGoHome - Callback for returning to home page
 * @param {Function} onTimeUp - Callback when game timer expires
 */
export default function GameInterface({ 
  match, 
  user,
  finished, 
  isGuest, 
  message, 
  onGuessLetter, 
  onGuessSentence,
  onAbandon, 
  onGoHome,
  onTimeUp
}) {
  // Early return if no match data available
  if (!match) return null;

  /**
   * Builds the revealed letters array for the Grid component
   * Handles different scenarios: finished games, ongoing games, and fallback cases
   * Returns array of characters (revealed) or null (hidden) for each position
   */
  const revealedLetters = useMemo(() => {
    const sentence = match.sentence || match.fullSentence;
    
    // For finished games with complete sentence: show all letters for proper coloring
    // Grid will color letters green (guessed) or red (missed) based on mask
    if (finished && sentence) {
      return sentence.split('');
    }
    
    // During active gameplay: use server-provided revealed array if available
    if (match.revealed && Array.isArray(match.revealed)) {
      return match.revealed;
    }
    
    // Fallback: construct revealed array from mask and sentence
    if (sentence && match.revealedMask) {
      const revealed = [];
      for (let i = 0; i < match.revealedMask.length; i++) {
        revealed[i] = match.revealedMask[i] === '1' ? sentence[i] : null;
      }
      return revealed;
    }
    
    // No usable data available
    return null;
  }, [match.sentence, match.fullSentence, match.revealed, match.revealedMask, finished]);

  return (
    <>
      {/* Game Status Message - displays feedback, errors, and game results */}
      {message && (
        <Alert 
          variant={
            message.includes('Error') ? 'danger' : 
            message.includes('won') || message.includes('Correct') ? 'success' : 
            'info'
          }
          className="text-center mb-3"
        >
          {message}
        </Alert>
      )}

      {/* Sentence Display Grid - shows revealed and hidden letters */}
      <Grid 
        mask={match.revealedMask} 
        spaces={match.spaces} 
        revealed={revealedLetters}
        sentence={match.sentence || match.fullSentence}
        finished={finished}
        className="mb-4"
      />

      {/* Game Controls Row - timer, sentence input, and action buttons */}
      <Row className="mb-3 justify-content-center align-items-center">
        {/* Game Timer */}
        <Col md={2}>
          <Timer 
            match={match} 
            onTimeUp={onTimeUp}
          />
        </Col>
        
        {/* Full Sentence Guess Input */}
        <Col md={6}>
          <GuessSentence 
            disabled={finished} 
            onGuess={onGuessSentence} 
            compact={true}
          />
        </Col>
        
        {/* Game Action Controls (abandon, home) */}
        <Col md={2}>
          <GameControls 
            match={match}
            finished={finished}
            onAbandon={onAbandon}
            onGoHome={onGoHome}
          />
        </Col>
      </Row>

      {/* Virtual Keyboard - letter selection interface */}
      <Row className="mb-4 justify-content-center">
        <Col>
          <Keyboard 
            onPick={onGuessLetter} 
            guessed={new Set(match.guessedLetters || [])} 
            usedVowel={match.usedVowel}
            disabled={finished}
            showCosts={!isGuest} // Show letter costs only for authenticated users
            userCoins={isGuest ? null : user?.coins} // Enable coin validation for authenticated users
          />
        </Col>
      </Row>
    </>
  );
}