import { useMemo } from 'react';
import { Row, Col, Alert } from 'react-bootstrap';
import Grid from './Grid.jsx';
import Keyboard from './Keyboard.jsx';
import GuessSentence from './GuessSentence.jsx';
import GameControls from './GameControls.jsx';

/**
 * GameInterface component - Displays the main game interface
 * @param {Object} match - Current match object
 * @param {boolean} finished - Whether the game is finished
 * @param {boolean} isGuest - Whether this is guest mode
 * @param {string} message - Game message to display
 * @param {Function} onGuessLetter - Callback for letter guess
 * @param {Function} onGuessSentence - Callback for sentence guess
 * @param {Function} onAbandon - Callback for abandon action
 * @param {Function} onGoHome - Callback for going home
 */
export default function GameInterface({ 
  match, 
  finished, 
  isGuest, 
  message, 
  onGuessLetter, 
  onGuessSentence, 
  onAbandon, 
  onGoHome 
}) {
  if (!match) return null;

  // Build revealed letters array based on mask and sentence
  const revealedLetters = useMemo(() => {
    console.log('🔍 useMemo buildRevealedLetters called:');
    console.log('   - finished:', finished);
    console.log('   - match.revealed:', match.revealed);
    console.log('   - match.revealedMask:', match.revealedMask);
    console.log('   - match.sentence:', match.sentence);
    console.log('   - match.fullSentence:', match.fullSentence);
    
    // Get the sentence from match (needed for building from mask or when finished)
    const sentence = match.sentence || match.fullSentence;
    
    // If match is finished AND we have the complete sentence, always show it
    // This allows Grid to color letters correctly (green for guessed, red for missing)
    if (finished && sentence) {
      console.log('🎯 Match finished with sentence, revealing complete sentence');
      console.log('   - Sentence:', sentence);
      console.log('   - Mask:', match.revealedMask);
      console.log('   - Status:', match.status);
      return sentence.split('');
    }
    
    // During gameplay, try to use the revealed array from server first
    if (match.revealed && Array.isArray(match.revealed)) {
      console.log('✅ Using revealed array from server:', match.revealed);
      return match.revealed;
    }
    
    // Fallback: build from mask during gameplay (if no revealed array from server)
    if (sentence && match.revealedMask) {
      console.log('🏗️ Building revealed array from mask and sentence');
      const revealed = [];
      for (let i = 0; i < match.revealedMask.length; i++) {
        if (match.revealedMask[i] === '1') {
          revealed[i] = sentence[i];
        } else {
          revealed[i] = null;
        }
      }
      console.log('   - Built revealed array:', revealed);
      return revealed;
    }
    
    console.log('❌ No usable data available for revealed letters');
    return null;
  }, [match.sentence, match.fullSentence, match.revealed, match.revealedMask, match.status, finished]);

  return (
    <>
      {/* Game Message */}
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

      {/* Game Grid */}
      <Grid 
        mask={match.revealedMask} 
        spaces={match.spaces} 
        revealed={revealedLetters}
        sentence={match.sentence || match.fullSentence}
        finished={finished}
        className="mb-4"
      />

      {/* Game Controls */}
      <Row className="mb-4">
        <Col md={8}>
          <Row>
            <Col>
              <Keyboard 
                onPick={onGuessLetter} 
                guessed={new Set(match.guessedLetters || [])} 
                usedVowel={match.usedVowel}
                disabled={finished}
                showCosts={!isGuest} // Only show costs for authenticated users
              />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <GuessSentence 
                disabled={finished} 
                onGuess={onGuessSentence} 
                compact={true} 
              />
            </Col>
          </Row>
        </Col>
        <Col md={4}>
          <GameControls 
            match={match}
            finished={finished}
            onAbandon={onAbandon}
            onGoHome={onGoHome}
          />
        </Col>
      </Row>
    </>
  );
}