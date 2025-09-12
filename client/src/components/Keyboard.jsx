import { Card, Badge, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { getLetterCosts } from '../api.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export default function Keyboard({ guessed, usedVowel, disabled, onPick }) {
  const [letterCosts, setLetterCosts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLetterCosts = async () => {
      try {
        const costs = await getLetterCosts();
        setLetterCosts(costs);
      } catch (error) {
        console.error('Failed to fetch letter costs:', error);
        // Fallback ai costi di default se l'API fallisce
        const fallbackCosts = {};
        LETTERS.forEach(letter => {
          if (VOWELS.has(letter)) {
            fallbackCosts[letter] = 10;
          } else {
            // Costi approssimativi per le consonanti
            const tier5 = new Set(['T','N','S','H','R']);
            const tier4 = new Set(['D','L','C']);
            const tier3 = new Set(['U','M','W','F']);
            const tier2 = new Set(['G','Y','P','B','V','K']);
            if (tier5.has(letter)) fallbackCosts[letter] = 5;
            else if (tier4.has(letter)) fallbackCosts[letter] = 4;
            else if (tier3.has(letter)) fallbackCosts[letter] = 3;
            else if (tier2.has(letter)) fallbackCosts[letter] = 2;
            else fallbackCosts[letter] = 1;
          }
        });
        setLetterCosts(fallbackCosts);
      } finally {
        setLoading(false);
      }
    };

    fetchLetterCosts();
  }, []);

  const renderLetter = (letter) => {
    const isGuessed = guessed.has(letter);
    const isVowel = VOWELS.has(letter);
    const cost = letterCosts[letter] || (isVowel ? 10 : 2);
    const canPick = !disabled && !isGuessed && (!isVowel || !usedVowel);
    
    let variant = 'outline-primary';
    if (isGuessed) {
      variant = 'secondary';
    } else if (isVowel) {
      variant = usedVowel ? 'outline-danger' : 'warning';
    }

    return (
      <Col key={letter} xs={2} sm={2} md={1} className="mb-2">
        <Badge
          as="button"
          bg={variant}
          className={`letter-badge w-100 p-2 ${canPick ? '' : 'disabled'}`}
          onClick={() => canPick && onPick(letter)}
          disabled={!canPick}
          style={{
            cursor: canPick ? 'pointer' : 'not-allowed',
            opacity: isGuessed ? 0.5 : 1,
            fontSize: '0.9rem'
          }}
        >
          <div>{letter}</div>
          <small style={{ fontSize: '0.7rem' }}>
            {isVowel ? '10' : cost}₵
          </small>
        </Badge>
      </Col>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">🔤 Letters Keyboard</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center p-3">
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            Loading letter costs...
          </div>
        ) : (
          <>
            <Row className="g-1">
              {LETTERS.map(renderLetter)}
            </Row>
            <div className="mt-3 text-center">
              <small className="text-muted">
                💰 Vowels cost 10 coins | Consonants vary by frequency
                {usedVowel && (
                  <span className="text-warning d-block">
                    ⚠️ Vowel already used in this match
                  </span>
                )}
              </small>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}