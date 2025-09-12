import { Card } from 'react-bootstrap';

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
    const out = [];
    for (let i = 0; i < mask.length; i++) {
      const isSpace = spaces[i];
      if (isSpace) {
        out.push(<span key={i} className="mx-2" style={{ display:'inline-block', width:16 }}>&nbsp;</span>);
        continue;
      }

      const isRevealed = mask[i] === '1';
      // priorità: 1) lettera rivelata dal server  2) se finito, usa la frase completa  3) placeholder
      const revealedLetter = Array.isArray(revealed) ? revealed[i] : null;
      const finalLetter = revealedLetter ?? (finished && sentence ? sentence[i] : null);

      let className = 'sentence-letter d-inline-flex align-items-center justify-content-center';
      let content = '•';

      if (finalLetter) {
        content = finalLetter;
        className += isRevealed ? ' guessed' : ' missing'; // verde se rivelata, rosso se rivelata solo a fine match
      } else if (!finished) {
        className += ' placeholder';
      } else {
        // match finito ma il server non ha inviato sentence completa: resta puntino
        className += ' placeholder';
      }

      out.push(<span key={i} className={className}>{content}</span>);
    }
    return out;
  }
  
  return (
    <Card className="mb-3">
      <Card.Header>
        <h5 className="mb-0">🎯 Guess the Sentence</h5>
      </Card.Header>
      <Card.Body className="py-3">
        <div className="text-center letter-spacing">
          {renderSentence()}
        </div>
        <div className="mt-2 text-center text-muted">
          <small>
            💡 Click letters below or type the full sentence to guess
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}