import { Card } from 'react-bootstrap';

export default function Grid({ mask, spaces }) {
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

  const renderSentence = () => {
    let elements = [];
    
    for (let i = 0; i < mask.length; i++) {
      if (spaces[i]) {
        // This is a space character
        elements.push(
          <span key={`space-${i}`} className="sentence-space"> </span>
        );
      } else {
        // This is a letter
        const isRevealed = mask[i] === '1';
        elements.push(
          <span
            key={`letter-${i}`}
            className={`sentence-letter ${isRevealed ? 'guessed' : 'placeholder'}`}
          >
            {isRevealed ? '●' : '_'}
          </span>
        );
      }
    }
    
    return elements;
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">🎯 Guess the Sentence</h5>
      </Card.Header>
      <Card.Body>
        <div className="text-center letter-spacing">
          {renderSentence()}
        </div>
        <div className="mt-3 text-center text-muted">
          <small>
            💡 Click letters below or type the full sentence to guess
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}