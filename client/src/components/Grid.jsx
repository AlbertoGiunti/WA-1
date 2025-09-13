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

  function renderSentence() {
    if (finished) {
      // console.log('🎯 Grid rendering finished game:');
      // console.log('   - Mask:', mask);
      // console.log('   - Revealed:', revealed);
      // console.log('   - Sentence:', sentence);
    }
    
    const out = [];
    for (let i = 0; i < mask.length; i++) {
      const isSpace = spaces[i];
      if (isSpace) {
        out.push(<span key={i} className="mx-2" style={{ display:'inline-block', width:16 }}>&nbsp;</span>);
        continue;
      }

      const isRevealed = mask[i] === '1';
      // Priority: 1) letter revealed by server  2) if finished, use complete sentence  3) placeholder
      const revealedLetter = Array.isArray(revealed) ? revealed[i] : null;
      const finalLetter = revealedLetter ?? (finished && sentence ? sentence[i] : null);

      let className = 'sentence-letter d-inline-flex align-items-center justify-content-center';
      let content = '•';

      if (finalLetter) {
        content = finalLetter;
        className += isRevealed ? ' guessed' : ' missing'; // green if revealed, red if revealed only at match end
      } else if (!finished) {
        className += ' placeholder';
      } else {
        // match finished but server didn't send complete sentence: keep placeholder dot
        className += ' placeholder';
      }

      out.push(<span key={i} className={className}>{content}</span>);
    }
    return out;
  }
  
  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">🎮 Guess the Sentence</h5>
      </Card.Header>
      <Card.Body className="py-3">
        <div className="text-center letter-spacing">
          {renderSentence()}
        </div>
        <div className="mt-2 text-center text-white">
          <small>
            💡 Click letters below or type the full sentence to guess
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}