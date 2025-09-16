import { Card } from 'react-bootstrap';

/**
 * Displays the sentence with revealed letters and placeholders
 * Shows guessed letters in green, missing letters in red (when finished)
 * @param {string} mask - Binary string indicating revealed positions
 * @param {boolean[]} spaces - Array indicating space positions
 * @param {string[]} revealed - Array of revealed letters (null for hidden)
 * @param {string} sentence - Complete sentence (shown when finished)
 * @param {boolean} finished - Whether the game has ended
 */
export default function Grid({ mask, spaces, revealed, sentence, finished }) {
  if (!mask || !spaces) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Sentence</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center">
            <em>No sentence loaded yet</em>
          </div>
        </Card.Body>
      </Card>
    );
  }

  /**
   * Renders the sentence by grouping letters into words to prevent word breaking
   * Applies appropriate styling based on letter state (revealed, missing, placeholder)
   */
  function renderSentence() {
    // Group letters into words to prevent word breaking
    const words = [];
    let currentWord = [];
    
    for (let i = 0; i < mask.length; i++) {
      const isSpace = spaces[i];
      
      if (isSpace) {
        // End current word and add it to words array
        if (currentWord.length > 0) {
          words.push({ type: 'word', letters: currentWord });
          currentWord = [];
        }
        // Add space as separate element
        words.push({ 
          type: 'space', 
          element: <span key={`space-${i}`} className="mx-2" style={{ display:'inline-block', width:16 }}>&nbsp;</span>
        });
        continue;
      }

      // Process letter position and determine its display state
      const isRevealed = mask[i] === '1';
      const revealedLetter = Array.isArray(revealed) ? revealed[i] : null;
      const finalLetter = revealedLetter ?? (finished && sentence ? sentence[i] : null);

      // Set CSS classes and content based on letter state
      let className = 'sentence-letter d-inline-flex align-items-center justify-content-center';
      let content = '•';

      // Apply styling based on letter state
      if (finalLetter) {
        content = finalLetter;
        className += isRevealed ? ' guessed' : ' missing';
      } else {
        className += ' placeholder';
      }

      // Add letter element to current word
      currentWord.push(<span key={i} className={className}>{content}</span>);
    }
    
    // Add remaining word to words array if it exists
    if (currentWord.length > 0) {
      words.push({ type: 'word', letters: currentWord });
    }
    
    // Render each word as an unbreakable unit to prevent line breaking
    return words.map((word, index) => {
      if (word.type === 'space') {
        return word.element;
      } else {
        // Wrap word in span with nowrap to prevent breaking mid-word
        return (
          <span key={`word-${index}`} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
            {word.letters}
          </span>
        );
      }
    });
  }
  
  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">🎮 Guess the Sentence</h5>
      </Card.Header>
      <Card.Body className="py-3">
        {/* Main sentence display area */}
        <div className="text-center letter-spacing">
          {renderSentence()}
        </div>
        
        {/* Helper text for user guidance */}
        <div className="mt-2 text-center text-white">
          <small>
            💡 Click letters below or type the full sentence to guess
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}